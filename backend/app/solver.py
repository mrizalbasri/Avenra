from types import SimpleNamespace

from ortools.sat.python import cp_model

from app.validation import validate_plan


def solve_plans(curriculum, profile, plan, time_limit=3.0) -> dict:
    credit_cap = min(plan.credit_cap, curriculum.credit_cap)
    completed = set(profile.completed) - set(plan.failed)
    remaining = [course for course in curriculum.courses if course.code not in completed]
    if not remaining:
        return {
            "status": "complete",
            "alternatives": [],
            "message": "All demo requirements are already complete.",
        }
    terms = list(range(profile.current_term, plan.horizon + 1))
    if not terms:
        return {
            "status": "infeasible",
            "alternatives": [],
            "message": "The horizon ends before the current term. Extend the planning horizon.",
        }
    alternatives = []
    timed_out = False
    for objective in ("Earlier completion", "Lighter peak workload"):
        model = cp_model.CpModel()
        x = {(c.code, t): model.new_bool_var(f"{c.code}_{t}") for c in remaining for t in terms}
        scheduled = {}
        for course in remaining:
            model.add(sum(x[course.code, t] for t in terms) == 1)
            scheduled[course.code] = model.new_int_var(terms[0], terms[-1], course.code)
            model.add(scheduled[course.code] == sum(t * x[course.code, t] for t in terms))
            for term in terms:
                if term % 2 not in course.offered_terms:
                    model.add(x[course.code, term] == 0)
        for course in remaining:
            for prerequisite in course.prerequisites:
                if prerequisite not in completed:
                    model.add(scheduled[prerequisite] < scheduled[course.code])
        loads = [sum(c.credits * x[c.code, t] for c in remaining) for t in terms]
        for load in loads:
            model.add(load <= credit_cap)
        finish = model.new_int_var(terms[0], terms[-1], "finish")
        model.add_max_equality(finish, list(scheduled.values()))
        peak = model.new_int_var(0, credit_cap, "peak")
        model.add_max_equality(peak, loads)
        if objective == "Earlier completion":
            model.minimize(finish * 10000 + sum(scheduled.values()))
        else:
            model.minimize(peak * 10000 + finish * 100 + sum(scheduled.values()))
        if alternatives:
            model.add(
                sum(x[c.code, alternatives[0]["assignments"][c.code]] for c in remaining)
                <= len(remaining) - 1
            )
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit
        solver.parameters.num_search_workers = 1
        solver.parameters.random_seed = 0
        status = solver.solve(model)
        if status == cp_model.UNKNOWN:
            timed_out = True
            continue
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            continue
        assignments = {c.code: solver.value(scheduled[c.code]) for c in remaining}
        candidate = SimpleNamespace(
            assignments=assignments,
            failed=plan.failed,
            horizon=plan.horizon,
            credit_cap=plan.credit_cap,
            revision=plan.revision,
        )
        validation = validate_plan(curriculum, profile, candidate)
        if validation["findings"]:
            raise RuntimeError("Solver output failed independent validation")
        alternatives.append(
            {
                "name": objective,
                "assignments": assignments,
                "validation": validation,
                "optimal": status == cp_model.OPTIMAL,
            }
        )
    status = "feasible" if alternatives else "timeout" if timed_out else "infeasible"
    messages = {
        "feasible": f"Found {len(alternatives)} distinct, independently checked plan(s).",
        "timeout": "Time limit reached without a plan. This does not prove infeasibility.",
        "infeasible": "No modeled solution. Extend the horizon or increase the credit limit.",
    }
    return {
        "status": status,
        "alternatives": alternatives,
        "message": messages[status],
        "source_revision": plan.revision,
        "profile_revision": profile.revision,
    }
