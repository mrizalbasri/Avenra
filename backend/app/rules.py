"""Academic rule inputs shared by the checker and the solver."""

from app.curriculum import Curriculum


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
    """
    gpa = planning_gpa(profile, plan)
    gpa_cap = curriculum.gpa_cap(gpa)
    caps = {}
    for term in terms:
        # On ties the first, most specific rule is reported.
        options = []
        if gpa_cap is not None and term == profile.current_term:
            options.append((gpa_cap, f"the IPS {gpa:.2f} rule"))
        options += [
            (curriculum.credit_cap, "the curriculum maximum"),
            (plan.credit_cap, "your plan limit"),
        ]
        cap, reason = min(options, key=lambda item: item[0])
        caps[term] = {"cap": cap, "reason": reason}
    return caps
