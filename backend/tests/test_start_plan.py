"""Confirmed tasks can carry a start plan: planned start date, first tiny step, and key details."""

from tests.test_goal_tasks import STUDENT_A, create_student_with_goal


def test_task_persists_start_plan_and_extracted_details(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    response = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={
            "course_code": "C1",
            "title": "BST Implementation",
            "due_date": "2026-12-03",
            "start_date": "2026-12-01",
            "first_step": "Create repo file and write Node class (10 min)",
            "details": ["Submit PDF + source code", "Cutoff 23:59 on LMS"],
        },
    )
    assert response.status_code == 201, response.text
    task = response.json()
    assert task["start_date"] == "2026-12-01"
    assert task["first_step"] == "Create repo file and write Node class (10 min)"
    assert task["details"] == ["Submit PDF + source code", "Cutoff 23:59 on LMS"]

    listed = client.get("/api/v1/study", headers=STUDENT_A).json()["tasks"]
    assert listed[0]["start_date"] == "2026-12-01"
    assert listed[0]["details"] == ["Submit PDF + source code", "Cutoff 23:59 on LMS"]


def test_task_rejects_start_date_after_due_date(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    response = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={
            "course_code": "C1",
            "title": "Impossible schedule",
            "due_date": "2026-12-01",
            "start_date": "2026-12-05",
        },
    )
    assert response.status_code == 422


def test_task_without_start_plan_fields_defaults_cleanly(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    response = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"course_code": "C1", "title": "Simple target", "first_step": "   "},
    )
    assert response.status_code == 201, response.text
    task = response.json()
    assert task["start_date"] is None
    assert task["first_step"] is None
    assert task["details"] == []
