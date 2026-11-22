"""Every user-facing message also carries a stable code and params for translation.

The English `message` stays as the default and fallback. The frontend renders text
from `code` and `params` in the chosen language.
"""

from types import SimpleNamespace

from app.curriculum import Curriculum
from app.validation import validate_plan
from tests.conftest import editable


def save(client, plan, **changes):
    response = client.patch(f"/api/v1/plans/{plan['id']}", json=editable(plan) | changes)
    assert response.status_code == 200, response.text
    return response.json()


def solve(client, plan):
    response = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        json={"revision": plan["revision"], "profile_revision": 1},
    )
    assert response.status_code == 200
    return response.json()


def by_rule(findings, rule, course=None):
    return next(
        f for f in findings if f["rule"] == rule and (course is None or f["course"] == course)
    )


def validated(workspace, **plan_changes):
    curriculum = Curriculum.model_validate(workspace["curriculum"])
    plan = SimpleNamespace(**workspace["plans"][0])
    for key, value in plan_changes.items():
        setattr(plan, key, value)
    return validate_plan(curriculum, SimpleNamespace(**workspace["profile"]), plan)


def test_every_finding_has_a_code_equal_to_its_rule_and_params(client, workspace):
    plan = workspace["plans"][0]
    saved = save(client, plan, assignments=plan["assignments"] | {"IF2201": 3})
    for finding in saved["validation"]["findings"]:
        assert finding["code"] == finding["rule"]
        assert isinstance(finding["params"], dict)


def test_prerequisite_and_offering_findings_name_their_courses(client, workspace):
    plan = workspace["plans"][0]
    findings = save(client, plan, assignments=plan["assignments"] | {"IF2201": 3})["validation"][
        "findings"
    ]
    assert by_rule(findings, "PREREQUISITE", "IF2201")["params"] == {
        "course": "IF2201",
        "prerequisite": "IF2101",
    }
    assert by_rule(findings, "OFFERING", "IF2201")["params"] == {
        "course": "IF2201",
        "parity": "even",
        "term": 3,
    }


def test_credit_cap_finding_reports_numbers_and_the_rule_that_sets_the_limit(client, workspace):
    saved = save(client, workspace["plans"][0], expected_gpa=1.5)
    validation = saved["validation"]
    assert by_rule(validation["findings"], "CREDIT_CAP")["params"] == {
        "term": 3,
        "credits": 18,
        "cap": 15,
        "reason": "IPS_RULE",
        "gpa": 1.5,
    }
    assert validation["cap_details"]["3"] == {"code": "IPS_RULE", "params": {"gpa": 1.5}}
    assert validation["cap_details"]["4"] == {"code": "CURRICULUM_MAX", "params": {}}
    # The English string stays for existing readers.
    assert validation["cap_reasons"]["3"] == "the IPS 1.50 rule"


def test_plan_limit_is_reported_as_its_own_cap_reason(client, workspace):
    saved = save(client, workspace["plans"][0], credit_cap=12)
    assert saved["validation"]["cap_details"]["4"] == {"code": "PLAN_LIMIT", "params": {}}


def test_graduation_credit_and_unscheduled_findings(client, workspace):
    plan = workspace["plans"][0]
    saved = save(client, plan, assignments=plan["assignments"] | {"IF5001": None})
    assert by_rule(saved["validation"]["findings"], "GRADUATION_CREDITS")["params"] == {
        "reached": 141,
        "target": 144,
        "missing": 3,
    }
    findings = save(client, saved, assignments=plan["assignments"] | {"IF3101": None})[
        "validation"
    ]["findings"]
    unscheduled = by_rule(findings, "UNSCHEDULED", "IF3101")
    assert unscheduled["params"]["course"] == "IF3101"
    assert unscheduled["params"]["name"]


def test_retake_finding_reports_the_failed_and_earliest_retake_semester(client, workspace):
    saved = save(client, workspace["plans"][0], failed=["IF2101"])
    assert by_rule(saved["validation"]["findings"], "RETAKE", "IF2101")["params"] == {
        "course": "IF2101",
        "current": 3,
        "next": 4,
    }


def test_any_of_corequisite_and_earned_credit_findings_carry_their_numbers(client, workspace):
    plan = workspace["plans"][0]
    assignments = plan["assignments"] | {"IF2204": 6, "IF2105": 7, "IF2102": 5, "IF4101": 3}
    findings = save(client, plan, assignments=assignments)["validation"]["findings"]
    any_of = by_rule(findings, "ANY_PREREQUISITE", "IF3104")["params"]
    assert any_of["course"] == "IF3104"
    assert isinstance(any_of["options"], list) and len(any_of["options"]) >= 2
    coreq = by_rule(findings, "COREQUISITE", "IF2106")
    assert coreq["params"] == {"course": "IF2106", "corequisite": coreq["related"]}
    earned = by_rule(findings, "CREDITS_EARNED", "IF4101")["params"]
    assert earned["course"] == "IF4101" and earned["term"] == 3
    assert earned["earned"] < earned["required"]


def test_term_range_and_study_period_findings(workspace):
    findings = validated(
        workspace, assignments=workspace["plans"][0]["assignments"] | {"IF4201": 10}
    )["findings"]
    assert by_rule(findings, "TERM_RANGE", "IF4201")["params"] == {
        "course": "IF4201",
        "start": 3,
        "end": 8,
    }
    curriculum = Curriculum.model_validate(workspace["curriculum"]).model_copy(
        update={"max_terms": 9}
    )
    plan = SimpleNamespace(**workspace["plans"][0])
    plan.horizon = 12
    plan.assignments = plan.assignments | {"IF4201": 11}
    findings = validate_plan(curriculum, SimpleNamespace(**workspace["profile"]), plan)["findings"]
    assert by_rule(findings, "STUDY_PERIOD", "IF4201")["params"] == {
        "course": "IF4201",
        "term": 11,
        "max_terms": 9,
    }


def test_assumptions_have_codes_and_match_the_english_list(client, workspace):
    saved = save(client, workspace["plans"][0], expected_gpa=1.5)
    validation = saved["validation"]
    items = validation["assumption_items"]
    assert [item["message"] for item in items] == validation["assumptions"]
    assert [item["code"] for item in items] == [
        "DISCLAIMER",
        "RULE_SOURCE",
        "IPS_RULE",
        "OFFERINGS",
    ]
    assert items[0]["params"] == {"text": workspace["curriculum"]["disclaimer"]}
    assert items[1]["params"] == {"source": workspace["curriculum"]["source"]}
    assert items[2]["params"] == {
        "gpa": 1.5,
        "term": 3,
        "cap": workspace["curriculum"]["credit_cap"],
    }


def test_advisor_questions_have_codes_and_params(client, workspace):
    saved = save(client, workspace["plans"][0], failed=["IF2101"], expected_gpa=1.5)
    validation = saved["validation"]
    items = validation["advisor_items"]
    assert [item["message"] for item in items] == validation["advisor_questions"]
    by_code = {item["code"]: item["params"] for item in items}
    assert by_code["RETAKE"]["course"] == "IF2101"
    assert by_code["RETAKE"]["term"] == saved["assignments"]["IF2101"]
    assert by_code["IPS_LIMIT"] == {"gpa": 1.5, "term": 3, "cap": 15}
    assert "RETAKE" in by_code["OPEN_ISSUES"]["rules"]
    assert "ACCURACY" in by_code


def test_infeasible_diagnosis_reasons_and_suggestions_have_codes_and_params(client, workspace):
    plan = save(client, workspace["plans"][0], credit_cap=12)
    result = solve(client, plan)
    assert (result["code"], result["params"]) == ("INFEASIBLE", {})
    diagnosis = result["diagnosis"]
    capacity = next(r for r in diagnosis["reasons"] if r["rule"] == "CAPACITY")
    assert capacity["code"] == "CAPACITY"
    assert (capacity["params"]["from"], capacity["params"]["to"]) == (3, 8)
    assert capacity["params"]["needed"] > capacity["params"]["capacity"]
    suggestions = {s["kind"]: s for s in diagnosis["suggestions"]}
    assert suggestions["horizon"]["code"] == "HORIZON"
    assert suggestions["horizon"]["params"] == {"term": 11}
    assert suggestions["credit_cap"]["code"] == "CREDIT_CAP"
    assert suggestions["credit_cap"]["params"] == {"cap": 18}


def test_prerequisite_chain_reason_lists_the_chain_as_data(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["IF1201", "MA1201"], expected_gpa=1.8)
    reasons = solve(client, plan)["diagnosis"]["reasons"]
    chain = next(r for r in reasons if r["rule"] == "PREREQUISITE_CHAIN")
    params = chain["params"]
    assert params["chain"][-1] == params["course"]
    assert params["chain"][:2] == ["MA1201", "IF2103"] or "MA1201" in params["chain"]
    assert params["end"] == 8 and params["start"] > 8
    assert all(r["code"] == r["rule"] and isinstance(r["params"], dict) for r in reasons)


def test_a_course_larger_than_any_semester_is_reported_with_its_numbers(workspace):
    from app.solver import diagnose

    curriculum = Curriculum.model_validate(workspace["curriculum"])
    plan = SimpleNamespace(**workspace["plans"][0])
    plan.credit_cap = 2
    curriculum = curriculum.model_copy(update={"credit_cap": 2})
    reasons = diagnose(curriculum, SimpleNamespace(**workspace["profile"]), plan)["reasons"]
    big = next(r for r in reasons if r["rule"] == "CREDIT_CAP")
    assert big["code"] == "CREDIT_CAP"
    assert big["params"]["cap"] == 2 and big["params"]["credits"] > 2
    assert big["params"]["course"]


def test_alternatives_have_name_codes_and_structured_summaries(client, workspace):
    saved = save(client, workspace["plans"][0], failed=["IF1201"])
    first, second = solve(client, saved)["alternatives"]
    assert (first["name_code"], second["name_code"]) == ("EARLIER_COMPLETION", "LIGHTER_PEAK")
    assert first["name"] == "Earlier completion"
    assert first["summary_items"] == [
        {
            "code": "ALT_SUMMARY",
            "params": {
                "finish": first["validation"]["completion_term"],
                "peak": first["validation"]["peak_credits"],
            },
        }
    ]
    summary, compare = second["summary_items"]
    assert summary["code"] == "ALT_SUMMARY"
    assert compare["code"] == "ALT_COMPARE"
    assert compare["params"] == {
        "against": "EARLIER_COMPLETION",
        "later": second["validation"]["completion_term"] - first["validation"]["completion_term"],
        "lighter": first["validation"]["peak_credits"] - second["validation"]["peak_credits"],
    }


def test_solve_outcomes_carry_a_code_and_params(client, workspace):
    saved = save(client, workspace["plans"][0], failed=["IF1201"])
    found = solve(client, saved)
    assert found["status"] == "feasible"
    assert (found["code"], found["params"]) == ("FOUND", {"count": 2, "note": None})
    from app.solver import solve_plans

    curriculum = Curriculum.model_validate(workspace["curriculum"])
    timeout = solve_plans(
        curriculum,
        SimpleNamespace(**workspace["profile"]),
        SimpleNamespace(**workspace["plans"][0]),
        time_limit=0,
    )
    assert (timeout["code"], timeout["params"]) == ("TIMEOUT", {})


def error(response, status, code):
    assert response.status_code == status, response.text
    detail = response.json()["detail"]
    assert detail["code"] == code
    assert isinstance(detail["message"], str) and detail["message"]
    assert isinstance(detail["params"], dict)
    return detail


def test_missing_things_report_a_code_with_the_english_message(client, workspace):
    detail = error(client.get("/api/v1/plans/nope"), 404, "PLAN_NOT_FOUND")
    assert detail["message"] == "Plan not found."
    fresh = {"X-Workspace-ID": "nobody-yet"}
    detail = error(client.get("/api/v1/study", headers=fresh), 404, "PROFILE_NOT_FOUND")
    assert detail["message"] == "Open the synthetic demo workspace first."


def test_conflicts_report_codes(client, workspace):
    plan = workspace["plans"][0]
    payload = editable(plan)
    assert client.patch(f"/api/v1/plans/{plan['id']}", json=payload).status_code == 200
    error(client.patch(f"/api/v1/plans/{plan['id']}", json=payload), 409, "PLAN_CONFLICT")
    stale_solve = client.post(
        f"/api/v1/plans/{plan['id']}/solve", json={"revision": 1, "profile_revision": 1}
    )
    error(stale_solve, 409, "SOLVE_CONFLICT")
    profile = workspace["profile"]
    body = {
        "revision": 99,
        "alias": profile["alias"],
        "current_term": 3,
        "completed": profile["completed"],
        "last_gpa": 3.0,
    }
    error(client.patch("/api/v1/profile", json=body), 409, "PROFILE_CONFLICT")
    stale_profile = editable(plan, profile_revision=99) | {"revision": plan["revision"] + 1}
    error(client.patch(f"/api/v1/plans/{plan['id']}", json=stale_profile), 409, "PROFILE_CHANGED")
    task = client.post(
        "/api/v1/study/tasks", json={"course_code": "IF2101", "title": "Read chapter"}
    ).json()
    done = {"revision": task["revision"], "done": True}
    assert client.patch(f"/api/v1/study/tasks/{task['id']}", json=done).status_code == 200
    error(client.patch(f"/api/v1/study/tasks/{task['id']}", json=done), 409, "TASK_CONFLICT")


def test_validation_failures_report_codes_and_params(client, workspace):
    plan = workspace["plans"][0]
    bad_code = editable(plan)
    bad_code["assignments"] = bad_code["assignments"] | {"UNKNOWN": 3}
    error(client.patch(f"/api/v1/plans/{plan['id']}", json=bad_code), 422, "UNKNOWN_COURSES")
    bad_term = editable(plan)
    bad_term["assignments"] = bad_term["assignments"] | {"IF2201": 40}
    detail = error(
        client.patch(f"/api/v1/plans/{plan['id']}", json=bad_term), 422, "TERM_OUT_OF_RANGE"
    )
    assert detail["params"]["max"] >= 8
    early = editable(plan) | {"horizon": 1}
    error(client.patch(f"/api/v1/plans/{plan['id']}", json=early), 422, "HORIZON_BEFORE_CURRENT")


def test_profile_progress_issue_lists_courses_and_missing_prerequisites(client, workspace):
    profile = workspace["profile"]
    payload = {
        "revision": profile["revision"],
        "alias": profile["alias"],
        "current_term": 3,
        "completed": ["IF2101"],
        "last_gpa": 3.0,
    }
    detail = error(client.patch("/api/v1/profile", json=payload), 422, "PROGRESS_ISSUES")
    assert {"course": "IF2101", "missing": ["IF1201", "MA1102"]} in detail["params"]["issues"]
    assert "IF2101 needs IF1201, MA1102" in detail["message"]
