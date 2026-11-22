from app.curriculum import Curriculum
from app.rules import completed_codes, earliest_retake, last_term, planning_gpa, term_caps


def validate_plan(curriculum: Curriculum, profile, plan) -> dict:
    courses = {course.code: course for course in curriculum.courses}
    completed = completed_codes(profile, plan)
    end = last_term(curriculum, plan)
    terms = list(range(profile.current_term, end + 1))
    caps = term_caps(curriculum, profile, plan, terms)
    loads = {term: 0 for term in terms}
    findings = []
    scheduled: dict[str, int] = {}

    def finding(code, rule, message, related=None):
        findings.append({"course": code, "rule": rule, "message": message, "related": related})

    for code, course in courses.items():
        if code in completed:
            continue
        term = plan.assignments.get(code)
        if term is None:
            if course.category == "required":
                finding(code, "UNSCHEDULED", f"{code} {course.name} has not been scheduled.")
            continue
        if term not in loads:
            if term > curriculum.max_terms:
                finding(
                    code,
                    "STUDY_PERIOD",
                    f"{code} is placed in semester {term}, beyond the maximum study period "
                    f"of {curriculum.max_terms} semesters.",
                )
            else:
                finding(
                    code,
                    "TERM_RANGE",
                    f"{code} must be between semesters {profile.current_term} and {end}.",
                )
            continue
        scheduled[code] = term
        loads[term] += course.credits
        if term < earliest_retake(profile, plan, code):
            finding(
                code,
                "RETAKE",
                f"{code} fails in semester {profile.current_term} in this scenario, so it "
                f"can be retaken from semester {profile.current_term + 1}.",
            )

    completed_credits = sum(courses[c].credits for c in completed if c in courses)

    def done_before(code, term, same_term=False):
        if code in completed:
            return True
        placed = scheduled.get(code)
        return placed is not None and (placed <= term if same_term else placed < term)

    for code, term in scheduled.items():
        course = courses[code]
        if term % 2 not in course.offered_terms:
            parity = "odd" if 1 in course.offered_terms else "even"
            finding(
                code,
                "OFFERING",
                f"{code} is offered only in {parity} semesters, not semester {term}.",
            )
        for prerequisite in course.prerequisites:
            if not done_before(prerequisite, term):
                finding(
                    code,
                    "PREREQUISITE",
                    f"Complete {prerequisite} before taking {code}.",
                    prerequisite,
                )
        for group in course.any_prerequisites:
            if not any(done_before(option, term) for option in group):
                finding(
                    code,
                    "ANY_PREREQUISITE",
                    f"Complete one of {' or '.join(group)} before taking {code}.",
                    group[0],
                )
        for corequisite in course.corequisites:
            if not done_before(corequisite, term, same_term=True):
                finding(
                    code,
                    "COREQUISITE",
                    f"Take {corequisite} in the same semester as {code} or earlier.",
                    corequisite,
                )
        if course.min_credits_earned:
            earned = completed_credits + sum(
                courses[other].credits for other, placed in scheduled.items() if placed < term
            )
            if earned < course.min_credits_earned:
                finding(
                    code,
                    "CREDITS_EARNED",
                    f"{code} needs {course.min_credits_earned} earned credits before semester "
                    f"{term}; this plan reaches {earned}.",
                )

    for term, credits in loads.items():
        limit = caps[term]
        if credits > limit["cap"]:
            finding(
                None,
                "CREDIT_CAP",
                f"Semester {term} has {credits} credits; the limit is {limit['cap']} "
                f"under {limit['reason']}.",
            )

    planned_credits = sum(loads.values())
    target = curriculum.graduation_credits or sum(c.credits for c in curriculum.courses)
    if curriculum.graduation_credits and completed_credits + planned_credits < target:
        missing = target - completed_credits - planned_credits
        finding(
            None,
            "GRADUATION_CREDITS",
            f"This plan reaches {completed_credits + planned_credits} of {target} graduation "
            f"credits. Add {missing} more credits, for example from electives.",
        )

    gpa = planning_gpa(profile, plan)
    result = {
        "status": "invalid" if findings else "valid_under_assumptions",
        "findings": findings,
        "loads": loads,
        "caps": {term: value["cap"] for term, value in caps.items()},
        "cap_reasons": {term: value["reason"] for term, value in caps.items()},
        "completed_credits": completed_credits,
        "planned_credits": planned_credits,
        "graduation_credits": target,
        "remaining_credits": max(0, target - completed_credits),
        "completion_term": None
        if findings
        else max(scheduled.values(), default=profile.current_term - 1),
        "peak_credits": max(loads.values(), default=0),
        "planning_gpa": gpa,
        "curriculum_version": curriculum.version,
        "plan_revision": plan.revision,
        "profile_revision": profile.revision,
        "assumptions": assumptions(curriculum, profile, gpa),
    }
    result["advisor_questions"] = advisor_questions(curriculum, profile, plan, result)
    return result


def assumptions(curriculum: Curriculum, profile, gpa) -> list[str]:
    notes = [curriculum.disclaimer, f"Rule source: {curriculum.source}"]
    if curriculum.gpa_credit_rules:
        if gpa is None:
            notes.append("No IPS was entered, so the IPS credit rule is not applied.")
        else:
            notes.append(
                f"The IPS credit rule uses {gpa:.2f} for semester {profile.current_term} only. "
                f"Later semesters assume up to {curriculum.credit_cap} credits."
            )
    notes.append(
        "Offerings follow the stated odd/even calendar. Exceptions, transfer credit, and "
        "internship conversion are not modeled."
    )
    return notes


def advisor_questions(curriculum: Curriculum, profile, plan, result) -> list[str]:
    """Questions drawn from this plan, so the consultation starts from real issues."""
    courses = {course.code: course for course in curriculum.courses}
    questions = []
    for code in plan.failed:
        course = courses.get(code)
        term = plan.assignments.get(code)
        if course and term:
            questions.append(
                f"Can I retake {code} {course.name} in semester {term}, and is it still "
                "offered on that calendar?"
            )
    gpa = result["planning_gpa"]
    if curriculum.gpa_credit_rules and gpa is not None:
        cap = result["caps"].get(profile.current_term)
        questions.append(
            f"With an IPS of {gpa:.2f}, is my limit for semester {profile.current_term} "
            f"really {cap} credits?"
        )
    rules = sorted({f["rule"].replace("_", " ").lower() for f in result["findings"]})
    if rules:
        questions.append(
            f"This plan still has {', '.join(rules)} issues. Is there an exception or a "
            "better arrangement?"
        )
    if any(c.category == "elective" for c in curriculum.courses):
        questions.append(
            "Do the electives in this plan count toward my graduation requirement and "
            "concentration?"
        )
    completion = result["completion_term"]
    if completion and completion > 8:
        questions.append(
            f"Finishing in semester {completion} is later than 8 semesters. Does this "
            "affect my tuition (UKT), scholarship, or study period limit?"
        )
    questions.append("Are the prerequisites and offerings used here accurate for my intake year?")
    return questions[:6]


def bottlenecks(curriculum: Curriculum, failed: list[str], completed=()) -> list[dict]:
    """Courses that depend, directly or through a chain, on a failed course."""
    passed = set(completed) - set(failed)
    result = []
    for root in failed:
        queue = [(root, [root])]
        seen = {root}
        while queue:
            parent, path = queue.pop(0)
            for course in curriculum.courses:
                depends = parent in course.prerequisites or parent in course.corequisites
                if depends and course.code not in seen and course.code not in passed:
                    seen.add(course.code)
                    child_path = [*path, course.code]
                    result.append({"root": root, "course": course.code, "path": child_path})
                    queue.append((course.code, child_path))
    return result
