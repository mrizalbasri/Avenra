"""Students can edit courses, prerequisites, and IPS rules after onboarding."""

from copy import deepcopy

from tests.conftest import editable
from tests.test_complete_import import HEADERS, payload, small_curriculum


def create_workspace(client):
    response = client.post("/api/v1/workspace/import", headers=HEADERS, json=payload())
    assert response.status_code == 201, response.text
    return response.json()


def test_edit_curriculum_recomputes_plan_and_flags_new_prerequisite_finding(client):
    ws = create_workspace(client)
    plan = ws["plans"][0]
    assert plan["validation"]["findings"] == []

    # C1 is planned in semester 3, C2 in semester 4. Add C3 in semester 3 requiring C1 -> finding!
    curriculum = deepcopy(ws["curriculum"])
    curriculum["courses"].append(
        {
            "code": "C3",
            "name": "Extra",
            "credits": 3,
            "recommended_term": 3,
            "prerequisites": ["C1"],
            "offered_terms": [0, 1],
            "category": "required",
        }
    )
    # Also make C1 require C2 (C1 is in term 3, C2 is in term 4 -> PREREQUISITE violation on C1).
    for course in curriculum["courses"]:
        if course["code"] == "C1":
            course["prerequisites"] = ["B1", "C2"]
        if course["code"] == "C2":
            course["prerequisites"] = ["B1"]

    response = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": curriculum},
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["profile"]["revision"] == ws["profile"]["revision"] + 1
    assert updated["curriculum"]["status"] == "user_supplied"
    findings = updated["plans"][0]["validation"]["findings"]
    assert any(f["rule"] == "PREREQUISITE" and f["course"] == "C1" for f in findings)
    assert any(f["rule"] == "UNSCHEDULED" and f["course"] == "C3" for f in findings)


def test_edit_curriculum_rejects_stale_revision(client):
    ws = create_workspace(client)
    curriculum = deepcopy(ws["curriculum"])
    body = {"revision": ws["profile"]["revision"], "curriculum": curriculum}
    assert client.patch("/api/v1/curriculum", headers=HEADERS, json=body).status_code == 200
    stale = client.patch("/api/v1/curriculum", headers=HEADERS, json=body)
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "PROFILE_CONFLICT"


def test_edit_curriculum_rejects_cycles_and_unknown_references(client):
    ws = create_workspace(client)
    cycle = deepcopy(ws["curriculum"])
    for course in cycle["courses"]:
        if course["code"] == "C1":
            course["prerequisites"] = ["C2"]
        if course["code"] == "C2":
            course["prerequisites"] = ["C1"]
    res_cycle = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": cycle},
    )
    assert res_cycle.status_code == 422

    unknown = deepcopy(ws["curriculum"])
    unknown["courses"][-1]["prerequisites"] = ["NOPE999"]
    res_unknown = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": unknown},
    )
    assert res_unknown.status_code == 422


def test_edit_curriculum_rejects_removing_passed_course_or_breaking_progress(client):
    ws = create_workspace(client)
    # A1 is passed; removing it must be rejected.
    removed = deepcopy(ws["curriculum"])
    removed["courses"] = [c for c in removed["courses"] if c["code"] != "A1"]
    for course in removed["courses"]:
        course["prerequisites"] = [p for p in course["prerequisites"] if p != "A1"]
    res_removed = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": removed},
    )
    assert res_removed.status_code == 422
    assert res_removed.json()["detail"]["code"] == "COMPLETED_COURSE_REMOVED"
    assert res_removed.json()["detail"]["params"]["courses"] == ["A1"]

    # B1 is passed, C1 is not passed; making B1 require C1 violates progress_issues.
    broken = deepcopy(ws["curriculum"])
    for course in broken["courses"]:
        if course["code"] == "B1":
            course["prerequisites"] = ["A1", "C1"]
        if course["code"] == "C1":
            course["prerequisites"] = ["A1"]
    res_broken = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": broken},
    )
    assert res_broken.status_code == 422
    assert res_broken.json()["detail"]["code"] == "PROGRESS_ISSUES"


def test_edit_curriculum_prunes_deleted_unpassed_course_from_existing_plans(client):
    ws = create_workspace(client)
    # C2 is unpassed and planned in semester 4; deleting it should leave the plan saveable.
    trimmed = deepcopy(small_curriculum())
    trimmed["courses"] = [c for c in trimmed["courses"] if c["code"] != "C2"]
    updated = client.patch(
        "/api/v1/curriculum",
        headers=HEADERS,
        json={"revision": ws["profile"]["revision"], "curriculum": trimmed},
    )
    assert updated.status_code == 200, updated.text
    plan = updated.json()["plans"][0]
    assert "C2" not in plan["assignments"]
    # Saving the plan with the updated profile revision succeeds without UNKNOWN_COURSES.
    saved = client.patch(
        f"/api/v1/plans/{plan['id']}",
        headers=HEADERS,
        json=editable(plan, profile_revision=updated.json()["profile"]["revision"]),
    )
    assert saved.status_code == 200, saved.text
