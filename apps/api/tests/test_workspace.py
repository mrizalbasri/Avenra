from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.curriculum import Curriculum, load_demo_curriculum
from app.solver import solve_plans
from app.validation import validate_plan
from tests.conftest import editable


def test_bootstrap_is_idempotent(client, workspace):
    again = client.post("/api/v1/workspace/bootstrap").json()
    assert len(again["plans"]) == 1
    assert again["profile"]["id"] == workspace["profile"]["id"]
    assert not again["plans"][0]["validation"]["findings"]


def test_plan_roundtrip_and_stale_revision(client, workspace):
    plan = workspace["plans"][0]
    payload = editable(plan)
    payload["assignments"]["CS301"] = 2
    payload["layout"] = {"CS301": {"x": 33, "y": 290, "term": 2}}
    saved = client.patch(f"/api/v1/plans/{plan['id']}", json=payload)
    assert saved.status_code == 200
    assert any(f["rule"] == "PREREQUISITE" for f in saved.json()["validation"]["findings"])
    reread = client.get(f"/api/v1/plans/{plan['id']}").json()["plan"]
    assert reread["assignments"]["CS301"] == 2
    assert reread["layout"]["CS301"] == {"x": 33, "y": 290, "term": 2}
    assert reread["revision"] == plan["revision"] + 1
    assert client.patch(f"/api/v1/plans/{plan['id']}", json=payload).status_code == 409


def test_disruption_has_paths_and_solver_outputs_are_distinct_valid_plans(client, workspace):
    plan = workspace["plans"][0]
    payload = editable(plan)
    payload["failed"] = ["CS101"]
    saved = client.patch(f"/api/v1/plans/{plan['id']}", json=payload).json()
    assert any(b["course"] == "CS501" for b in saved["bottlenecks"])
    response = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        json={"revision": saved["revision"], "profile_revision": 1},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "feasible"
    assert len(result["alternatives"]) == 2
    assert result["alternatives"][0]["assignments"] != result["alternatives"][1]["assignments"]
    for alternative in result["alternatives"]:
        snapshot = SimpleNamespace(**saved)
        snapshot.assignments = alternative["assignments"]
        assert not validate_plan(
            load_demo_curriculum(), SimpleNamespace(**workspace["profile"]), snapshot
        )["findings"]
    assert client.get("/api/v1/workspace").json()["profile"]["completed"] == ["CS101", "MA101"]


def test_infeasible_is_not_timeout(client, workspace):
    plan = workspace["plans"][0]
    payload = editable(plan)
    payload["credit_cap"] = 1
    saved = client.patch(f"/api/v1/plans/{plan['id']}", json=payload).json()
    result = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        json={"revision": saved["revision"], "profile_revision": 1},
    ).json()
    assert result["status"] == "infeasible"
    assert not result["alternatives"]
    timeout = solve_plans(
        load_demo_curriculum(),
        SimpleNamespace(**workspace["profile"]),
        SimpleNamespace(**plan),
        time_limit=0,
    )
    assert timeout["status"] == "timeout"


def test_profile_revision_invalidates_old_plan_save_and_solve(client, workspace):
    profile = workspace["profile"]
    profile["alias"] = "Updated alias"
    profile.pop("id")
    profile.pop("curriculum")
    assert client.patch("/api/v1/profile", json=profile).status_code == 200
    plan = workspace["plans"][0]
    assert client.patch(f"/api/v1/plans/{plan['id']}", json=editable(plan)).status_code == 409
    assert (
        client.post(
            f"/api/v1/plans/{plan['id']}/solve", json={"revision": 1, "profile_revision": 1}
        ).status_code
        == 409
    )


def test_clone_archive_restore_and_invalid_codes(client, workspace):
    original = workspace["plans"][0]
    clone = client.post(
        "/api/v1/plans", json={"name": "Recovery plan", "copy_from": original["id"]}
    ).json()
    assert clone["id"] != original["id"]
    payload = editable(clone)
    payload["archived"] = True
    archived = client.patch(f"/api/v1/plans/{clone['id']}", json=payload).json()
    assert archived["archived"]
    payload = editable(archived)
    payload["archived"] = False
    assert not client.patch(f"/api/v1/plans/{clone['id']}", json=payload).json()["archived"]
    payload = editable(original)
    payload["assignments"]["UNKNOWN"] = 3
    assert client.patch(f"/api/v1/plans/{original['id']}", json=payload).status_code == 422


def test_credit_limits_unscheduled_and_offerings_are_checked(workspace):
    curriculum = load_demo_curriculum()
    plan = SimpleNamespace(**workspace["plans"][0])
    profile = SimpleNamespace(**workspace["profile"])
    plan.credit_cap = 2
    plan.assignments["CS301"] = None
    curriculum.courses[2].offered_terms = [1]
    findings = validate_plan(curriculum, profile, plan)["findings"]
    assert {"CREDIT_CAP", "UNSCHEDULED", "OFFERING"} <= {f["rule"] for f in findings}


def test_curriculum_rejects_cycles_and_unknown_references():
    fixture = load_demo_curriculum().model_dump()
    fixture["courses"][0]["prerequisites"] = ["CS501"]
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)
    fixture["courses"][0]["prerequisites"] = ["UNKNOWN"]
    with pytest.raises(ValidationError):
        Curriculum.model_validate(fixture)


def test_tasks_and_focus_sessions_persist_without_duplicates(client, workspace):
    task = client.post(
        "/api/v1/study/tasks",
        json={"course_code": "CS201", "title": "Practice linked lists", "due_date": "2026-11-01"},
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
        "course_code": "CS201",
        "seconds": 1500,
        "note": "Solved 5 exercises",
    }
    assert client.post("/api/v1/study/sessions", json=session).status_code == 201
    assert client.post("/api/v1/study/sessions", json=session).status_code == 201
    study = client.get("/api/v1/study").json()
    assert study["tasks"][0]["done"]
    assert len(study["sessions"]) == 1
    assert study["sessions"][0]["seconds"] == 1500
