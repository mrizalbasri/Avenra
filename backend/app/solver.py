from types import SimpleNamespace

from ortools.sat.python import cp_model

from app.curriculum import Curriculum
from app.rules import (
    completed_codes,
    earliest_retake,
    last_term,
    planning_gpa,
    term_caps,
)
from app.validation import validate_plan

OBJECTIVES = ("Earlier completion", "Lighter peak workload")
OBJECTIVE_CODES = {OBJECTIVES[0]: "EARLIER_COMPLETION", OBJECTIVES[1]: "LIGHTER_PEAK"}


def _reason(rule: str, message: str, **params) -> dict:
    """A diagnosis reason: `rule` is its stable code, `params` fill the translation."""
    return {"rule": rule, "code": rule, "message": message, "params": params}


def _suggestion(kind: str, code: str, value: int, message: str, **params) -> dict:
    return {"kind": kind, "code": code, "value": value, "message": message, "params": params}


def variant(plan, **changes):
    """A plan-shaped object for what-if solves; the stored plan is never changed."""
    fields = ("assignments", "failed", "horizon", "credit_cap", "revision", "expected_gpa")
    values = {field: getattr(plan, field, None) for field in fields}
    return SimpleNamespace(**(values | changes))


def _solve(curriculum: Curriculum, profile, plan, objective=None, exclude=(), time_limit=3.0):
    """Build and solve one CP-SAT model. Returns (status, assignments or None)."""
    completed = completed_codes(profile, plan)
    courses = {c.code: c for c in curriculum.courses}
    remaining = [c for c in curriculum.courses if c.code not in completed]
    terms = list(range(profile.current_term, last_term(curriculum, plan) + 1))
    if not terms:
        return cp_model.INFEASIBLE, None
    caps = term_caps(curriculum, profile, plan, terms)
    completed_credits = sum(courses[c].credits for c in completed if c in courses)

    model = cp_model.CpModel()
    x = {
        (c.code, t): model.new_bool_var(f"{c.code}_{t}")
        for c in remaining
        for t in terms
        if t % 2 in c.offered_terms and t >= earliest_retake(profile, plan, c.code)
    }

    def placed(code, latest):
        """Variables placing a course in any term up to and including latest."""
        return [x[code, t] for t in terms if (code, t) in x and t <= latest]

    def require(var, options):
        if options:
            model.add(sum(options) >= 1).only_enforce_if(var)
        else:
            model.add(var == 0)

    for course in remaining:
        options = placed(course.code, terms[-1])
        if course.category == "required":
            if not options:
                return cp_model.INFEASIBLE, None
            model.add(sum(options) == 1)
        elif options:
            model.add(sum(options) <= 1)
    for (code, term), var in x.items():
        course = courses[code]
        for prerequisite in course.prerequisites:
            if prerequisite not in completed:
                require(var, placed(prerequisite, term - 1))
        for group in course.any_prerequisites:
            if not set(group) & completed:
                require(var, [v for o in group for v in placed(o, term - 1)])
        for corequisite in course.corequisites:
            if corequisite not in completed:
                require(var, placed(corequisite, term))
        needed = course.min_credits_earned - completed_credits
        if needed > 0:
            earned = [
                courses[other].credits * other_var
                for (other, other_term), other_var in x.items()
                if other != code and other_term < term
            ]
            if earned:
                model.add(sum(earned) >= needed).only_enforce_if(var)
            else:
                model.add(var == 0)
    loads = []
    for term in terms:
        load = sum(c.credits * x[c.code, term] for c in remaining if (c.code, term) in x)
        model.add(load <= caps[term]["cap"])
        loads.append(load)
    if curriculum.graduation_credits:
        model.add(
            completed_credits + sum(courses[code].credits * var for (code, _), var in x.items())
            >= curriculum.graduation_credits
        )
    for solution in exclude:
        chosen = [x[key] for key in solution.items() if key in x]
        if chosen:
            model.add(sum(chosen) <= len(chosen) - 1)

    if objective:
        term_of = {
            c.code: sum(t * v for (code, t), v in x.items() if code == c.code) for c in remaining
        }
        finish = model.new_int_var(0, terms[-1], "finish")
        model.add_max_equality(finish, list(term_of.values()))
        peak = model.new_int_var(0, 24, "peak")
        model.add_max_equality(peak, loads)
        order = sum(term_of.values())
        if objective == OBJECTIVES[0]:
            model.minimize(finish * 10000 + order)
        else:
            model.minimize(peak * 10000 + finish * 100 + order)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = 0
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return status, None
    assignments = {c.code: None for c in remaining}
    for (code, term), var in x.items():
        if solver.value(var):
            assignments[code] = term
    return status, assignments


def _feasible(curriculum, profile, plan) -> bool:
    status, _ = _solve(curriculum, profile, plan, time_limit=1.0)
    return status in (cp_model.OPTIMAL, cp_model.FEASIBLE)


def _smallest(low, high, works):
    """Smallest value in [low, high] that works, assuming larger values never hurt."""
    if low > high or not works(high):
        return None
    while low < high:
        middle = (low + high) // 2
        if works(middle):
            high = middle
        else:
            low = middle + 1
    return low


def _earliest_terms(curriculum: Curriculum, profile, plan):
    """Earliest semester for each course from prerequisite chains and offerings alone."""
    completed = completed_codes(profile, plan)
    courses = {c.code: c for c in curriculum.courses}
    memo: dict[str, tuple[int, str | None]] = {}

    def earliest(code, visiting=frozenset()):
        if code in completed:
            return profile.current_term - 1, None
        if code in memo:
            return memo[code]
        if code in visiting:
            return profile.current_term, None
        course = courses[code]
        start, via = earliest_retake(profile, plan, code), None
        inner = visiting | {code}
        for prerequisite in course.prerequisites:
            term = earliest(prerequisite, inner)[0] + 1
            if term > start:
                start, via = term, prerequisite
        for group in course.any_prerequisites:
            option = min(group, key=lambda o: earliest(o, inner)[0])
            term = earliest(option, inner)[0] + 1
            if term > start:
                start, via = term, option
        for corequisite in course.corequisites:
            term = earliest(corequisite, inner)[0]
            if term > start:
                start, via = term, corequisite
        while start % 2 not in course.offered_terms:
            start += 1
        memo[code] = (start, via)
        return memo[code]

    for code in courses:
        earliest(code)
    return memo


def diagnose(curriculum: Curriculum, profile, plan) -> dict:
    """Explain why no plan exists and find the smallest change that would allow one."""
    completed = completed_codes(profile, plan)
    remaining = [c for c in curriculum.courses if c.code not in completed]
    required = [c for c in remaining if c.category == "required"]
    end = last_term(curriculum, plan)
    terms = list(range(profile.current_term, end + 1))
    caps = term_caps(curriculum, profile, plan, terms)
    reasons = []

    largest_cap = max((value["cap"] for value in caps.values()), default=0)
    for course in required:
        if course.credits > largest_cap:
            reasons.append(
                _reason(
                    "CREDIT_CAP",
                    f"{course.code} has {course.credits} credits, more than any "
                    f"semester allows ({largest_cap}).",
                    course=course.code,
                    credits=course.credits,
                    cap=largest_cap,
                )
            )

    earliest = _earliest_terms(curriculum, profile, plan)
    late = sorted(
        (c for c in required if earliest[c.code][0] > end),
        key=lambda c: -earliest[c.code][0],
    )
    for course in late[:3]:
        chain, code = [], course.code
        while code:
            chain.append(code)
            code = earliest[code][1]
        reasons.append(
            _reason(
                "PREREQUISITE_CHAIN",
                f"{course.code} cannot start before semester "
                f"{earliest[course.code][0]} because of the chain "
                f"{' | '.join(reversed(chain))} and the odd/even calendar. "
                f"The plan ends at semester {end}.",
                course=course.code,
                start=earliest[course.code][0],
                chain=list(reversed(chain)),
                end=end,
            )
        )

    completed_credits = sum(c.credits for c in curriculum.courses if c.code in completed)
    required_credits = sum(c.credits for c in required)
    needed = required_credits
    if curriculum.graduation_credits:
        needed = max(needed, curriculum.graduation_credits - completed_credits)
    capacity = sum(value["cap"] for value in caps.values())
    if needed > capacity:
        reasons.append(
            _reason(
                "CAPACITY",
                f"You still need {needed} credits, but semesters "
                f"{profile.current_term} to {end} allow at most {capacity}.",
                needed=needed,
                capacity=capacity,
                **{"from": profile.current_term, "to": end},
            )
        )

    gpa = planning_gpa(profile, plan)
    gpa_cap = curriculum.gpa_cap(gpa)
    if (
        gpa_cap is not None
        and gpa_cap < min(plan.credit_cap, curriculum.credit_cap)
        and _feasible(curriculum, profile, variant(plan, expected_gpa=4.0))
    ):
        reasons.append(
            _reason(
                "GPA_CREDIT_LIMIT",
                f"The IPS {gpa:.2f} limit of {gpa_cap} credits in semester "
                f"{profile.current_term} is part of the conflict.",
                gpa=gpa,
                cap=gpa_cap,
                term=profile.current_term,
            )
        )

    suggestions = []
    horizon = _smallest(
        end + 1,
        curriculum.max_terms,
        lambda h: _feasible(curriculum, profile, variant(plan, horizon=h)),
    )
    if horizon:
        suggestions.append(
            _suggestion(
                "horizon",
                "HORIZON",
                horizon,
                f"Extend the plan to semester {horizon}.",
                term=horizon,
            )
        )
    cap = _smallest(
        plan.credit_cap + 1,
        curriculum.credit_cap,
        lambda value: _feasible(curriculum, profile, variant(plan, credit_cap=value)),
    )
    if cap:
        suggestions.append(
            _suggestion(
                "credit_cap",
                "CREDIT_CAP",
                cap,
                f"Raise your own credit limit to {cap} credits.",
                cap=cap,
            )
        )
    if not reasons:
        reasons.append(
            _reason(
                "COMBINED",
                "The modeled rules conflict only in combination, for example "
                "corequisites, earned-credit thresholds, and credit limits together.",
            )
        )
    return {"reasons": reasons, "suggestions": suggestions}


def _explain(curriculum, plan, alternatives):
    names = {c.code: c.name for c in curriculum.courses}
    first = alternatives[0]["validation"] if alternatives else None
    for alternative in alternatives:
        validation = alternative["validation"]
        changes = [
            {"code": code, "name": names[code], "from": plan.assignments.get(code), "to": term}
            for code, term in alternative["assignments"].items()
            if plan.assignments.get(code) != term
        ]
        summary = (
            f"Finishes in semester {validation['completion_term']} with at most "
            f"{validation['peak_credits']} credits in one semester."
        )
        items = [
            {
                "code": "ALT_SUMMARY",
                "params": {
                    "finish": validation["completion_term"],
                    "peak": validation["peak_credits"],
                },
            }
        ]
        if validation is not first:
            later = validation["completion_term"] - first["completion_term"]
            lighter = first["peak_credits"] - validation["peak_credits"]
            items.append(
                {
                    "code": "ALT_COMPARE",
                    "params": {
                        "against": OBJECTIVE_CODES[alternatives[0]["name"]],
                        "later": later,
                        "lighter": lighter,
                    },
                }
            )
            timing = (
                f"{later} semester{'s' if later != 1 else ''} later"
                if later > 0
                else "at the same time"
                if later == 0
                else f"{-later} semester{'s' if later != -1 else ''} earlier"
            )
            load = (
                f"{lighter} fewer credits at peak"
                if lighter > 0
                else "the same peak load"
                if lighter == 0
                else f"{-lighter} more credits at peak"
            )
            summary += f" Compared with {alternatives[0]['name']}: finishes {timing}, {load}."
        alternative["summary"] = summary
        alternative["summary_items"] = items
        alternative["changes"] = changes


def _finish_term(curriculum, profile, plan, time_limit=2.0):
    """Earliest semester every requirement can be finished.

    Returns (term, proven). Only an OPTIMAL solve proves the earliest term; a
    time-limited FEASIBLE answer or a timeout is reported as unproven so the caller
    never shows a guess as fact. (None, True) means no plan fits at all.
    """
    status, assignments = _solve(curriculum, profile, plan, OBJECTIVES[0], time_limit=time_limit)
    if assignments is None:
        return None, status == cp_model.INFEASIBLE
    placed = [term for term in assignments.values() if term is not None]
    term = max(placed) if placed else profile.current_term - 1
    return term, status == cp_model.OPTIMAL


def outlook(curriculum: Curriculum, profile, plan) -> dict:
    """When this student graduates under the saved plan, and what could delay it.

    completion_term follows the saved plan when it passes every rule, otherwise the
    earliest modeled finish. A course planned this semester is critical when failing
    it pushes the earliest modeled finish later. Every number comes from the same
    solver and checker; unproven answers are left out rather than guessed.
    """
    target = curriculum.target_terms
    # Simulate over the full study period, so a delay is a number, not "does not fit".
    longest = curriculum.max_terms
    earliest, proven = _finish_term(curriculum, profile, variant(plan, horizon=longest))
    checked = validate_plan(curriculum, profile, plan)
    plan_term = checked["completion_term"]
    completion = plan_term if plan_term is not None else earliest
    result = {
        "target_term": target,
        "completion_term": completion,
        "plan_term": plan_term,
        "earliest_term": earliest if proven else None,
        "basis": "plan" if plan_term is not None else "earliest",
        "plan_findings": len(checked["findings"]),
        "delay": None if completion is None else max(0, completion - target),
        "critical": [],
        "timed_out": not proven,
    }
    if completion is None:
        result["status"] = "unresolved" if proven else "unknown"
        return result
    if plan_term is None and not proven:
        # Neither a valid saved plan nor a proven earliest finish: say nothing definite.
        result["status"] = "unknown"
        return result
    result["status"] = "late" if completion > target else "on_track"
    if not proven:
        return result
    names = {c.code: c for c in curriculum.courses}
    completed = completed_codes(profile, plan)
    this_term = [
        code
        for code, term in plan.assignments.items()
        if term == profile.current_term and code in names and code not in completed
    ]
    for code in this_term:
        if code in plan.failed:
            continue
        failed_finish, failed_proven = _finish_term(
            curriculum, profile, variant(plan, failed=[*plan.failed, code], horizon=longest)
        )
        if not failed_proven:
            # A timeout says nothing about the course; do not flag it.
            result["timed_out"] = True
            continue
        extra = None if failed_finish is None else failed_finish - earliest
        if extra is None or extra > 0:
            result["critical"].append(
                {
                    "code": code,
                    "name": names[code].name,
                    "extra_semesters": extra,
                    "finish_if_failed": failed_finish,
                    "late_if_failed": failed_finish is None or failed_finish > target,
                }
            )
    # Unrecoverable first, then the largest delay.
    result["critical"].sort(
        key=lambda c: (c["extra_semesters"] is not None, -(c["extra_semesters"] or 0))
    )
    return result


def solve_plans(curriculum: Curriculum, profile, plan, time_limit=3.0) -> dict:
    base = {"source_revision": plan.revision, "profile_revision": profile.revision}
    completed = completed_codes(profile, plan)
    completed_credits = sum(c.credits for c in curriculum.courses if c.code in completed)
    required_left = [
        c for c in curriculum.courses if c.code not in completed and c.category == "required"
    ]
    target = curriculum.graduation_credits or 0
    if not required_left and completed_credits >= target:
        return base | {
            "status": "complete",
            "code": "COMPLETE",
            "params": {},
            "alternatives": [],
            "message": "All modeled requirements are already complete.",
        }
    if last_term(curriculum, plan) < profile.current_term:
        return base | {
            "status": "infeasible",
            "code": "PLAN_ENDS_EARLY",
            "params": {},
            "alternatives": [],
            "message": "The plan ends before the current semester or beyond the maximum "
            "study period.",
            "diagnosis": {"reasons": [], "suggestions": []},
        }
    alternatives = []
    timed_out = False
    rejected = 0
    for objective in OBJECTIVES:
        status, assignments = _solve(
            curriculum,
            profile,
            plan,
            objective,
            exclude=[a["assignments"] for a in alternatives],
            time_limit=time_limit,
        )
        if status == cp_model.UNKNOWN:
            timed_out = True
            continue
        if assignments is None:
            if not alternatives:
                break
            continue
        validation = validate_plan(curriculum, profile, variant(plan, assignments=assignments))
        # The checker is independent of the model; a disagreement is never shown as a plan.
        if validation["findings"]:
            rejected += 1
            continue
        alternatives.append(
            {
                "name": objective,
                "name_code": OBJECTIVE_CODES[objective],
                "assignments": assignments,
                "validation": validation,
                "optimal": status == cp_model.OPTIMAL,
            }
        )
    _explain(curriculum, plan, alternatives)
    if alternatives:
        count = len(alternatives)
        message = f"Found {count} distinct, independently checked plan{'s' if count > 1 else ''}."
        note = None
        if count == 1 and timed_out:
            note = "timeout"
            message += " The second option hit the time limit, so another arrangement may exist."
        elif count == 1:
            note = "single"
            message += " No second valid arrangement differs from this one."
        return base | {
            "status": "feasible",
            "code": "FOUND",
            "params": {"count": count, "note": note},
            "alternatives": alternatives,
            "message": message,
        }
    if timed_out:
        return base | {
            "status": "timeout",
            "code": "TIMEOUT",
            "params": {},
            "alternatives": [],
            "message": "Time limit reached without a plan. This does not prove infeasibility.",
        }
    if rejected:
        return base | {
            "status": "unverified",
            "code": "UNVERIFIED",
            "params": {},
            "alternatives": [],
            "message": "A generated plan failed the independent rule check, so it is not "
            "shown. Please report this case.",
        }
    return base | {
        "status": "infeasible",
        "code": "INFEASIBLE",
        "params": {},
        "alternatives": [],
        "message": "No plan satisfies every modeled rule. The reasons and the smallest "
        "changes that would help are listed below.",
        "diagnosis": diagnose(curriculum, profile, plan),
    }
