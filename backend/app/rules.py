"""Academic rule inputs shared by the checker and the solver."""

from decimal import Decimal

from app.curriculum import Curriculum


def clean_hours(value: float) -> int | float:
    rounded = round(float(value), 2)
    return int(rounded) if rounded.is_integer() else rounded


def _hours_text(value: float) -> str:
    return f"{clean_hours(value):g}"


def goal_hours_in_term(profile, term: int) -> float:
    goals = getattr(profile, "goals", None) or []
    total = sum(
        (
            Decimal(str(goal["weekly_hours"]))
            for goal in goals
            if goal["start_term"] <= term <= goal["end_term"]
        ),
        Decimal("0"),
    )
    return float(total)


def time_budget_cap(profile, term: int) -> tuple[int, float, float, int] | None:
    """Credit limit implied by weekly hours available minus active goal hours."""
    budget = getattr(profile, "time_budget", None)
    if not budget:
        return None
    available = Decimal(str(budget["available_hours"]))
    used = Decimal(str(goal_hours_in_term(profile, term)))
    remaining = max(Decimal("0"), available - used)
    minutes_per_credit = int(budget.get("minutes_per_credit", 170))
    cap = int((remaining * 60) // Decimal(minutes_per_credit))
    return cap, float(remaining), float(available), minutes_per_credit


def completed_codes(profile, plan) -> set[str]:
    return set(profile.completed) - set(plan.failed)


def planning_gpa(profile, plan) -> float | None:
    """A scenario GPA overrides the profile GPA inside that plan only."""
    expected = getattr(plan, "expected_gpa", None)
    return expected if expected is not None else getattr(profile, "last_gpa", None)


def last_term(curriculum: Curriculum, plan) -> int:
    return min(plan.horizon, curriculum.max_terms)


def earliest_retake(profile, plan, code: str) -> int:
    """A course failed this semester can be retaken from next semester at the earliest.

    A course marked failed after being passed (a past grade) can return immediately.
    """
    if code in plan.failed and code not in profile.completed:
        return profile.current_term + 1
    return profile.current_term


def term_caps(curriculum: Curriculum, profile, plan, terms) -> dict[int, dict]:
    """Effective credit limit per term and the rule that sets it.

    The GPA (IPS) rule only applies to the next semester, because later grades are
    unknown. Later semesters use the curriculum maximum as a stated assumption.
    When a weekly time budget is set, it also caps each term based on remaining
    hours after goals active in that term.
    Each entry also carries a stable `code` and `params` so the reason can be translated.
    """
    gpa = planning_gpa(profile, plan)
    gpa_cap = curriculum.gpa_cap(gpa)
    caps = {}
    for term in terms:
        # On ties the first, most specific rule is reported.
        options = []
        if gpa_cap is not None and term == profile.current_term:
            options.append((gpa_cap, f"the IPS {gpa:.2f} rule", "IPS_RULE", {"gpa": gpa}))
        budget_info = time_budget_cap(profile, term)
        if budget_info is not None:
            budget_cap, remaining, available, minutes_per_credit = budget_info
            options.append(
                (
                    budget_cap,
                    f"your weekly time budget ({_hours_text(remaining)} h left for courses)",
                    "TIME_BUDGET",
                    {
                        "hours": clean_hours(remaining),
                        "available": clean_hours(available),
                        "minutes_per_credit": minutes_per_credit,
                    },
                )
            )
        options += [
            (curriculum.credit_cap, "the curriculum maximum", "CURRICULUM_MAX", {}),
            (plan.credit_cap, "your plan limit", "PLAN_LIMIT", {}),
        ]
        cap, reason, code, params = min(options, key=lambda item: item[0])
        caps[term] = {"cap": cap, "reason": reason, "code": code, "params": params}
    return caps
