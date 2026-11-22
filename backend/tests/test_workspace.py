from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.curriculum import Curriculum, load_demo_curriculum
from app.solver import solve_plans
from app.validation import validate_plan
from tests.conftest import editable


def save(client, plan, **changes):
    payload = editable(plan) | changes
    response = client.patch(f"/api/v1/plans/{plan['id']}", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def solve(client, plan):
    response = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        json={"revision": plan["revision"], "profile_revision": 1},
    )
    assert response.status_code == 200
    return response.json()


def test_bootstrap_is_idempotent_and_valid(client, workspace):
    again = client.post("/api/v1/workspace/bootstrap").json()
    assert len(again["plans"]) == 1
    assert again["profile"]["id"] == workspace["profile"]["id"]
    validation = again["plans"][0]["validation"]
    assert not validation["findings"]
    assert validation["completed_credits"] + validation["planned_credits"] == 144
    assert again["curriculum"]["version"] == "demo-3"


def test_plan_roundtrip_and_stale_revision(client, workspace):
    plan = workspace["plans"][0]
    payload = editable(plan)
    payload["assignments"]["IF2201"] = 3
    payload["layout"] = {"IF2201": {"x": 33, "y": 290, "term": 3}}
    saved = client.patch(f"/api/v1/plans/{plan['id']}", json=payload)
    assert saved.status_code == 200
    messages = {f["message"] for f in saved.json()["validation"]["findings"]}
    assert "Complete IF2101 before taking IF2201." in messages
    assert "IF2201 is offered only in even semesters, not semester 3." in messages
    reread = client.get(f"/api/v1/plans/{plan['id']}").json()["plan"]
    assert reread["assignments"]["IF2201"] == 3
    assert reread["layout"]["IF2201"] == {"x": 33, "y": 290, "term": 3}
    assert reread["revision"] == plan["revision"] + 1
    assert client.patch(f"/api/v1/plans/{plan['id']}", json=payload).status_code == 409


def test_disruption_has_paths_and_solver_outputs_are_distinct_valid_plans(client, workspace):
    plan = workspace["plans"][0]
    saved = save(client, plan, failed=["IF1201"])
    downstream = {b["course"] for b in saved["bottlenecks"]}
    assert {"IF2101", "IF2201", "IF3201"} <= downstream
    result = solve(client, saved)
    assert result["status"] == "feasible"
    assert len(result["alternatives"]) == 2
    first, second = result["alternatives"]
    assert first["assignments"] != second["assignments"]
    assert first["assignments"]["IF1201"] % 2 == 0
    assert second["summary"].startswith("Finishes in semester")
    assert "Compared with Earlier completion" in second["summary"]
    assert first["changes"]
    curriculum = Curriculum.model_validate(workspace["curriculum"])
    for alternative in result["alternatives"]:
        snapshot = SimpleNamespace(**saved)
        snapshot.assignments = alternative["assignments"]
        assert not validate_plan(curriculum, SimpleNamespace(**workspace["profile"]), snapshot)[
            "findings"
        ]
    assert "IF1201" in client.get("/api/v1/workspace").json()["profile"]["completed"]


def test_failing_a_current_course_moves_its_retake_to_a_later_semester(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["IF2101"])
    assert any(f["rule"] == "RETAKE" for f in plan["validation"]["findings"])
    result = solve(client, plan)
    assert result["status"] == "feasible"
    # IF2101 is odd-only, so the earliest retake after failing semester 3 is semester 5.
    assert all(a["assignments"]["IF2101"] == 5 for a in result["alternatives"])
    assert all(a["assignments"]["IF2201"] >= 6 for a in result["alternatives"])


def test_outlook_reports_on_time_graduation_and_critical_courses(client, workspace):
    plan = workspace["plans"][0]
    result = client.get(f"/api/v1/plans/{plan['id']}/outlook").json()
    assert result["status"] == "on_track"
    assert (result["target_term"], result["completion_term"], result["delay"]) == (8, 8, 0)
    critical = {c["code"]: c for c in result["critical"]}
    assert set(critical) == {"IF2103"}
    assert critical["IF2103"]["extra_semesters"] == 1
    assert critical["IF2103"]["finish_if_failed"] == 9
    assert critical["IF2103"]["late_if_failed"]


def test_outlook_counts_an_existing_setback_and_reports_lateness(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["IF2101"])
    result = client.get(f"/api/v1/plans/{plan['id']}/outlook").json()
    assert result["status"] == "on_track"
    assert {"IF2103", "IF2104"} <= {c["code"] for c in result["critical"]}
    tight = save(client, plan, failed=["IF2101", "IF2103"], expected_gpa=1.8)
    late = client.get(f"/api/v1/plans/{tight['id']}/outlook").json()
    assert late["status"] == "late"
    assert late["completion_term"] > 8
    assert late["delay"] == late["completion_term"] - 8


def test_outlook_is_scoped_to_the_workspace(client, workspace):
    plan = workspace["plans"][0]
    other = {"X-Workspace-ID": "someone-else"}
    assert client.get(f"/api/v1/plans/{plan['id']}/outlook", headers=other).status_code == 404


def test_infeasible_reports_reasons_and_smallest_fix(client, workspace):
    plan = save(client, workspace["plans"][0], credit_cap=12)
    result = solve(client, plan)
    assert result["status"] == "infeasible"
    assert not result["alternatives"]
    assert any(r["rule"] == "CAPACITY" for r in result["diagnosis"]["reasons"])
    suggestions = {s["kind"]: s["value"] for s in result["diagnosis"]["suggestions"]}
    assert suggestions == {"horizon": 11, "credit_cap": 18}


def test_prerequisite_chain_explains_a_late_thesis(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["IF1201", "MA1201"], expected_gpa=1.8)
    result = solve(client, plan)
    assert result["status"] == "infeasible"
    chain = next(r for r in result["diagnosis"]["reasons"] if r["rule"] == "PREREQUISITE_CHAIN")
    assert "MA1201 | IF2103 | IF3106 | IF4103 | IF4201" in chain["message"]
    assert {"kind": "horizon", "value": 9} in [
        {"kind": s["kind"], "value": s["value"]} for s in result["diagnosis"]["suggestions"]
    ]


def test_timeout_is_not_infeasibility(workspace):
    curriculum = Curriculum.model_validate(workspace["curriculum"])
    timeout = solve_plans(
        curriculum,
        SimpleNamespace(**workspace["profile"]),
        SimpleNamespace(**workspace["plans"][0]),
        time_limit=0,
    )
    assert timeout["status"] == "timeout"


def test_gpa_rule_limits_only_the_next_semester(client, workspace):
    plan = save(client, workspace["plans"][0], expected_gpa=1.5)
    validation = plan["validation"]
    cap = next(f for f in validation["findings"] if f["rule"] == "CREDIT_CAP")
    assert cap["message"] == "Semester 3 has 18 credits; the limit is 15 under the IPS 1.50 rule."
    assert validation["caps"]["3"] == 15
    assert validation["caps"]["4"] == 24
    assert any("IPS of 1.50" in q for q in validation["advisor_questions"])
    result = solve(client, plan)
    assert result["status"] == "feasible"
    assert all(a["validation"]["loads"]["3"] <= 15 for a in result["alternatives"])


def test_any_of_corequisite_and_earned_credit_rules(client, workspace):
    plan = workspace["plans"][0]
    assignments = plan["assignments"] | {
        "IF2204": 6,
        "IF2105": 7,
        "IF2102": 5,
        "IF4101": 3,
    }
    findings = save(client, plan, assignments=assignments)["validation"]["findings"]
    rules = {(f["rule"], f["course"]) for f in findings}
    assert ("ANY_PREREQUISITE", "IF3104") in rules
    assert ("COREQUISITE", "IF2106") in rules
    assert ("CREDITS_EARNED", "IF4101") in rules


def test_electives_are_optional_but_graduation_credits_are_checked(client, workspace):
    plan = workspace["plans"][0]
    assignments = plan["assignments"] | {"IF5001": None}
    findings = save(client, plan, assignments=assignments)["validation"]["findings"]
    assert [f["rule"] for f in findings] == ["GRADUATION_CREDITS"]
    assert "141 of 144" in findings[0]["message"]


def test_out_of_horizon_courses_do_not_create_phantom_semesters(workspace):
    curriculum = Curriculum.model_validate(workspace["curriculum"])
    plan = SimpleNamespace(**workspace["plans"][0])
    plan.assignments = plan.assignments | {"IF4201": 10}
    validation = validate_plan(curriculum, SimpleNamespace(**workspace["profile"]), plan)
    assert list(validation["loads"]) == [3, 4, 5, 6, 7, 8]
    assert any(f["rule"] == "TERM_RANGE" for f in validation["findings"])
    short = curriculum.model_copy(update={"max_terms": 9})
    plan.horizon = 12
    plan.assignments = plan.assignments | {"IF4201": 11}
    findings = validate_plan(short, SimpleNamespace(**workspace["profile"]), plan)["findings"]
    assert any(f["rule"] == "STUDY_PERIOD" for f in findings)


def test_downstream_impact_skips_courses_already_passed(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["MA1102"])
    downstream = {b["course"] for b in plan["bottlenecks"]}
    assert "IF2101" in downstream
    assert "MA1202" not in downstream


def test_downstream_impact_follows_either_or_prerequisites(client, workspace):
    plan = save(client, workspace["plans"][0], failed=["IF2105"])
    assert "IF3104" in {b["course"] for b in plan["bottlenecks"]}


def test_profile_rejects_completed_courses_without_prerequisites(client, workspace):
    profile = workspace["profile"]
    payload = {
        "revision": profile["revision"],
        "alias": profile["alias"],
        "current_term": 3,
        "completed": ["IF2101"],
        "last_gpa": 3.0,
    }
    response = client.patch("/api/v1/profile", json=payload)
    assert response.status_code == 422
    assert "IF2101 needs IF1201, MA1102" in response.json()["detail"]
    payload["completed"] = profile["completed"]
    payload["last_gpa"] = 4.5
    assert client.patch("/api/v1/profile", json=payload).status_code == 422


def test_profile_revision_invalidates_old_plan_save_and_solve(client, workspace):
    profile = {
        key: workspace["profile"][key]
        for key in ("revision", "alias", "current_term", "completed", "last_gpa")
    }
    profile["alias"] = "Updated alias"
    assert client.patch("/api/v1/profile", json=profile).status_code == 200
    plan = workspace["plans"][0]
    assert client.patch(f"/api/v1/plans/{plan['id']}", json=editable(plan)).status_code == 409
    assert (
        client.post(
            f"/api/v1/plans/{plan['id']}/solve", json={"revision": 1, "profile_revision": 1}
        ).status_code
        == 409
    )


def test_alternative_is_saved_as_a_plan_in_one_request(client, workspace):
    original = save(client, workspace["plans"][0], failed=["IF1201"])
    alternative = solve(client, original)["alternatives"][0]
    created = client.post(
        "/api/v1/plans",
        json={
            "name": "Recovery",
            "copy_from": original["id"],
            "assignments": alternative["assignments"],
        },
    )
    assert created.status_code == 201
    plan = created.json()
    assert plan["failed"] == ["IF1201"]
    assert plan["revision"] == 1
    assert not plan["validation"]["findings"]
    bad = client.post(
        "/api/v1/plans",
        json={"name": "Bad", "copy_from": original["id"], "assignments": {"IF1201": 15}},
    )
    assert bad.status_code == 422
    assert len(client.get("/api/v1/workspace").json()["plans"]) == 2


def test_clone_archive_restore_and_invalid_codes(client, workspace):
    original = workspace["plans"][0]
    clone = client.post(
        "/api/v1/plans", json={"name": "Recovery plan", "copy_from": original["id"]}
    ).json()
    assert clone["id"] != original["id"]
    archived = save(client, clone, archived=True)
    assert archived["archived"]
    assert not save(client, archived, archived=False)["archived"]
    payload = editable(original)
    payload["assignments"]["UNKNOWN"] = 3
    assert client.patch(f"/api/v1/plans/{original['id']}", json=payload).status_code == 422


def test_credit_limits_unscheduled_and_offerings_are_checked(workspace):
    curriculum = Curriculum.model_validate(workspace["curriculum"])
    plan = SimpleNamespace(**workspace["plans"][0])
    profile = SimpleNamespace(**workspace["profile"])
    plan.credit_cap = 2
    plan.assignments = plan.assignments | {"IF3101": None, "IF2102": 4}
    findings = validate_plan(curriculum, profile, plan)["findings"]
    assert {"CREDIT_CAP", "UNSCHEDULED", "OFFERING"} <= {f["rule"] for f in findings}


def test_legacy_demo_workspaces_keep_their_original_curriculum(client):
    from sqlalchemy.orm import Session

    from app.models import Profile

    with Session(client.engine) as db:
        db.add(Profile(id="legacy", alias="Old demo", current_term=2, completed=["CS101"]))
        db.commit()
    data = client.get("/api/v1/workspace", headers={"X-Workspace-ID": "legacy"}).json()
    assert data["curriculum"]["version"] == "demo-2"


def test_curriculum_rejects_cycles_unknown_references_and_impossible_totals():
    fixture = load_demo_curriculum().model_dump()
    # IF2101 depends on IF1201, which depends on IF1101, so this closes a cycle.
    fixture["courses"][0]["prerequisites"] = ["IF2101"]
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)
    fixture["courses"][0]["prerequisites"] = ["UNKNOWN"]
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)
    fixture["courses"][0]["prerequisites"] = []
    fixture["courses"][0]["any_prerequisites"] = [["MA1101", "NOPE"]]
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)
    fixture["courses"][0]["any_prerequisites"] = []
    fixture["graduation_credits"] = 200
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)


def test_gpa_rules_pick_the_highest_eligible_tier():
    curriculum = load_demo_curriculum()
    assert curriculum.gpa_cap(3.5) == 24
    assert curriculum.gpa_cap(2.75) == 21
    assert curriculum.gpa_cap(2.0) == 18
    assert curriculum.gpa_cap(1.2) == 15
    assert curriculum.gpa_cap(None) is None


def test_tasks_and_focus_sessions_persist_without_duplicates(client, workspace):
    task = client.post(
        "/api/v1/study/tasks",
        json={"course_code": "IF2101", "title": "Practice linked lists", "due_date": "2026-11-01"},
    ).json()
    done = client.patch(f"/api/v1/study/tasks/{task['id']}", json={"revision": 1, "done": True})
    assert done.status_code == 200
    assert (
        client.patch(
            f"/api/v1/study/tasks/{task['id']}", json={"revision": 1, "done": False}
        ).status_code
        == 409
    )
    session = {
        "id": "session-test-123",
        "course_code": "IF2101",
        "seconds": 1500,
        "note": "Solved 5 exercises",
    }
    assert client.post("/api/v1/study/sessions", json=session).status_code == 201
    assert client.post("/api/v1/study/sessions", json=session).status_code == 201
    study = client.get("/api/v1/study").json()
    assert study["tasks"][0]["done"]
    assert len(study["sessions"]) == 1
    assert study["sessions"][0]["seconds"] == 1500
