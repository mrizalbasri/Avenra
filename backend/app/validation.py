from app.curriculum import Curriculum


def validate_plan(curriculum: Curriculum, profile, plan) -> dict:
    courses = {course.code: course for course in curriculum.courses}
    completed = set(profile.completed) - set(plan.failed)
    findings = []
    loads = {term: 0 for term in range(profile.current_term, plan.horizon + 1)}

    def finding(code, rule, message, related=None):
        findings.append({"course": code, "rule": rule, "message": message, "related": related})

    for code, course in courses.items():
        if code in completed:
            continue
        term = plan.assignments.get(code)
        if term is None:
            finding(code, "UNSCHEDULED", f"{course.name} has not been scheduled.")
            continue
        if term < profile.current_term or term > plan.horizon:
            finding(
                code,
                "TERM_RANGE",
                f"{code} must be between terms {profile.current_term} and {plan.horizon}.",
            )
        loads[term] = loads.get(term, 0) + course.credits
        if course.offered_terms and term % 2 not in course.offered_terms:
            finding(
                code, "OFFERING", f"{code} is not offered in term {term} under the demo calendar."
            )
        for prerequisite in course.prerequisites:
            if prerequisite in completed:
                continue
            prerequisite_term = plan.assignments.get(prerequisite)
            if prerequisite_term is None or prerequisite_term >= term:
                finding(
                    code,
                    "PREREQUISITE",
                    f"Complete {prerequisite} before taking {code}.",
                    prerequisite,
                )

    limit = min(plan.credit_cap, curriculum.credit_cap)
    for term, credits in loads.items():
        if credits > limit:
            finding(
                None,
                "CREDIT_CAP",
                f"Term {term} has {credits} credits; the effective limit is {limit}.",
            )
    remaining = [code for code in courses if code not in completed]
    scheduled_terms = [plan.assignments.get(code) for code in remaining]
    return {
        "status": "invalid" if findings else "valid_under_assumptions",
        "findings": findings,
        "loads": loads,
        "completed_credits": sum(courses[c].credits for c in completed if c in courses),
        "remaining_credits": sum(courses[c].credits for c in remaining),
        "completion_term": max(
            (t for t in scheduled_terms if t is not None), default=profile.current_term - 1
        )
        if not findings
        else None,
        "peak_credits": max(loads.values(), default=0),
        "curriculum_version": curriculum.version,
        "plan_revision": plan.revision,
        "profile_revision": profile.revision,
        "assumptions": [
            curriculum.disclaimer,
            f"Rule source: {curriculum.source}",
            "Hypothetical offerings. Exceptions and internship conversion are not modeled.",
        ],
    }


def bottlenecks(curriculum: Curriculum, failed: list[str]) -> list[dict]:
    result = []
    for root in failed:
        queue = [(root, [root])]
        seen = {root}
        while queue:
            parent, path = queue.pop(0)
            for course in curriculum.courses:
                if parent in course.prerequisites and course.code not in seen:
                    seen.add(course.code)
                    child_path = [*path, course.code]
                    result.append({"root": root, "course": course.code, "path": child_path})
                    queue.append((course.code, child_path))
    return result
