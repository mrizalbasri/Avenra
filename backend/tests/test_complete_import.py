"""One import request creates a ready workspace: passed courses, mission, goals, time."""

import pytest

HEADERS = {"X-Workspace-ID": "new-student"}


def small_curriculum(**changes):
    curriculum = {
        "id": "small",
        "name": "Example university | Informatika",
        "version": "2026",
        "status": "user_supplied",
        "disclaimer": "User-supplied curriculum. Verify rules with your university.",
        "source": "Faculty handbook",
        "credit_cap": 24,
        "graduation_credits": None,
        "max_terms": 8,
        "target_terms": 4,
        "gpa_credit_rules": [],
        "courses": [
            {
                "code": "A1",
                "name": "Basics",
                "credits": 3,
                "recommended_term": 1,
                "prerequisites": [],
            },
            {
                "code": "A2",
                "name": "Maths",
                "credits": 3,
                "recommended_term": 1,
                "prerequisites": [],
            },
            {
                "code": "B1",
                "name": "Next",
                "credits": 3,
                "recommended_term": 2,
                "prerequisites": ["A1"],
            },
            {
                "code": "C1",
                "name": "Later",
                "credits": 3,
                "recommended_term": 3,
                "prerequisites": ["B1"],
            },
            {
                "code": "C2",
                "name": "Last",
                "credits": 3,
                "recommended_term": 4,
                "prerequisites": ["C1"],
            },
        ],
    }
    return curriculum | changes


def payload(**changes):
    return {
        "alias": "Budi",
        "current_term": 3,
        "curriculum": small_curriculum(),
        "completed": ["A1", "A2", "B1"],
    } | changes


def import_workspace(client, body):
    return client.post("/api/v1/workspace/import", headers=HEADERS, json=body)


def no_workspace(client):
    return client.get("/api/v1/workspace", headers=HEADERS).json()["profile"] is None


GOAL = {
    "title": "Internship",
    "kind": "internship",
    "start_term": 6,
    "end_term": 6,
    "weekly_hours": 20,
}


def test_import_stores_passed_courses_and_plans_only_the_rest(client):
    response = import_workspace(client, payload())
    assert response.status_code == 201, response.text
    workspace = response.json()
    assert workspace["profile"]["completed"] == ["A1", "A2", "B1"]
    plan = workspace["plans"][0]
    assert set(plan["assignments"]) == {"C1", "C2"}
    assert plan["assignments"] == {"C1": 3, "C2": 4}
    assert plan["validation"]["findings"] == []
    assert plan["validation"]["completed_credits"] == 9


def test_outlook_is_correct_right_after_import(client):
    plan = import_workspace(client, payload()).json()["plans"][0]
    outlook = client.get(f"/api/v1/plans/{plan['id']}/outlook", headers=HEADERS).json()
    assert outlook["status"] == "on_track"
    assert (outlook["completion_term"], outlook["target_term"]) == (4, 4)


def test_import_rejects_a_passed_course_whose_prerequisite_is_not_passed(client):
    response = import_workspace(client, payload(completed=["B1"]))
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "PROGRESS_ISSUES"
    assert {"course": "B1", "missing": ["A1"]} in detail["params"]["issues"]
    assert "B1 needs A1" in detail["message"]
    assert no_workspace(client)


def test_import_stores_mission_goals_and_time_budget(client):
    body = payload(
        mission="Graduate on time and lead the student union.",
        goals=[GOAL, {**GOAL, "id": "bem", "title": "BEM", "kind": "organisation"}],
        time_budget={"available_hours": 45},
    )
    profile = import_workspace(client, body).json()["profile"]
    assert profile["mission"] == "Graduate on time and lead the student union."
    assert profile["time_budget"] == {"available_hours": 45, "minutes_per_credit": 170}
    first, second = profile["goals"]
    assert first["id"] and first["title"] == "Internship"
    assert second["id"] == "bem"
    assert first["id"] != second["id"]


def test_import_without_new_fields_keeps_working(client):
    body = payload()
    del body["completed"]
    profile = import_workspace(client, body | {"current_term": 1}).json()["profile"]
    assert profile["completed"] == []
    assert profile["goals"] == []
    assert profile["mission"] is None
    assert profile["time_budget"] is None


@pytest.mark.parametrize(
    "changes",
    [
        {"goals": [GOAL] * 4},
        {"goals": [{**GOAL, "weekly_hours": 169}]},
        {"goals": [{**GOAL, "start_term": 7, "end_term": 6}]},
        {"goals": [{**GOAL, "start_term": 6, "end_term": 9}]},
        {"goals": [{**GOAL, "kind": "party"}]},
        {"goals": [{**GOAL, "id": "same"}, {**GOAL, "id": "same"}]},
        {"time_budget": {"available_hours": 40, "minutes_per_credit": 59}},
        {"time_budget": {"available_hours": 40, "minutes_per_credit": 301}},
        {"time_budget": {"available_hours": 169}},
        {"completed": ["A1", "NOPE"]},
        {"completed": ["A1", "A1"]},
        {"mission": "x" * 501},
    ],
)
def test_invalid_import_is_rejected_without_a_partial_workspace(client, changes):
    response = import_workspace(client, payload(**changes))
    assert response.status_code == 422, changes
    assert no_workspace(client)


def profile_body(profile, **changes):
    keys = ("revision", "alias", "current_term", "completed", "last_gpa")
    return {key: profile[key] for key in keys} | changes


def test_profile_edit_stores_goals_and_keeps_them_when_omitted(client):
    profile = import_workspace(client, payload()).json()["profile"]
    saved = client.patch(
        "/api/v1/profile",
        headers=HEADERS,
        json=profile_body(
            profile,
            mission="Finish strong",
            goals=[GOAL],
            time_budget={"available_hours": 40, "minutes_per_credit": 150},
        ),
    )
    assert saved.status_code == 200, saved.text
    saved = saved.json()
    assert saved["mission"] == "Finish strong"
    assert saved["goals"][0]["id"]
    assert saved["time_budget"]["minutes_per_credit"] == 150

    # The current Profile page sends only the original fields.
    again = client.patch(
        "/api/v1/profile", headers=HEADERS, json=profile_body(saved, alias="Budi S")
    ).json()
    assert again["alias"] == "Budi S"
    assert again["mission"] == "Finish strong"
    assert again["goals"] == saved["goals"]
    assert again["time_budget"] == saved["time_budget"]


def test_profile_edit_rejects_goals_beyond_the_study_period(client):
    profile = import_workspace(client, payload()).json()["profile"]
    response = client.patch(
        "/api/v1/profile",
        headers=HEADERS,
        json=profile_body(profile, goals=[{**GOAL, "end_term": 9}]),
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "GOAL_TERM_RANGE"
    assert detail["params"] == {"max": 8}


def test_profile_edit_with_a_stale_revision_conflicts(client):
    profile = import_workspace(client, payload()).json()["profile"]
    body = profile_body(profile, goals=[GOAL])
    assert client.patch("/api/v1/profile", headers=HEADERS, json=body).status_code == 200
    stale = client.patch("/api/v1/profile", headers=HEADERS, json=body)
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "PROFILE_CONFLICT"
