from app.curriculum import load_demo_curriculum
from tests.conftest import editable


def test_personal_curricula_are_kept_in_separate_workspaces(client):
    first = {"X-Workspace-ID": "student-a"}
    second = {"X-Workspace-ID": "student-b"}
    demo = client.post("/api/v1/workspace/bootstrap", headers=first).json()
    curriculum = load_demo_curriculum().model_dump()
    curriculum["name"] = "Example university | Informatika"
    curriculum["source"] = "Faculty curriculum handbook"
    curriculum["graduation_credits"] = None
    curriculum["courses"] = [
        {
            "code": "IF1",
            "name": "Introduction",
            "credits": 3,
            "recommended_term": 1,
            "prerequisites": [],
        },
        {
            "code": "IF2",
            "name": "Advanced",
            "credits": 4,
            "recommended_term": 2,
            "prerequisites": ["IF1"],
        },
    ]
    imported = client.post(
        "/api/v1/workspace/import",
        headers=second,
        json={"alias": "Student B", "current_term": 1, "curriculum": curriculum},
    )
    assert imported.status_code == 201
    personal = imported.json()
    assert personal["curriculum"]["status"] == "user_supplied"
    assert personal["curriculum"]["source"] == "Faculty curriculum handbook"
    assert set(personal["plans"][0]["assignments"]) == {"IF1", "IF2"}
    assert len(client.get("/api/v1/workspace", headers=first).json()["curriculum"]["courses"]) == 52
    plan_id = demo["plans"][0]["id"]
    assert client.get(f"/api/v1/plans/{plan_id}", headers=second).status_code == 404
    assert (
        client.post(
            "/api/v1/plans", headers=second, json={"name": "Wrong workspace", "copy_from": plan_id}
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/v1/plans/{plan_id}", headers=second, json=editable(demo["plans"][0])
        ).status_code
        == 404
    )
    task = client.post(
        "/api/v1/study/tasks",
        headers=first,
        json={"course_code": "IF2101", "title": "A private target"},
    ).json()
    assert client.get("/api/v1/study", headers=second).json()["tasks"] == []
    assert (
        client.patch(
            f"/api/v1/study/tasks/{task['id']}", headers=second, json={"revision": 1, "done": True}
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/v1/workspace/import",
            headers=second,
            json={"alias": "Overwrite", "current_term": 1, "curriculum": curriculum},
        ).status_code
        == 409
    )


def test_invalid_import_does_not_create_a_partial_workspace(client):
    curriculum = load_demo_curriculum().model_dump()
    curriculum["courses"][0]["prerequisites"] = ["NOT_A_COURSE"]
    headers = {"X-Workspace-ID": "invalid-import"}
    response = client.post(
        "/api/v1/workspace/import",
        headers=headers,
        json={"alias": "Student", "current_term": 1, "curriculum": curriculum},
    )
    assert response.status_code == 422
    assert client.get("/api/v1/workspace", headers=headers).json()["profile"] is None
