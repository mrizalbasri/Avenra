"""Study tasks can be tagged to a goal, a course, or both; focus sessions still need a course."""

from tests.test_complete_import import GOAL, payload

STUDENT_A = {"X-Workspace-ID": "student-a"}
STUDENT_B = {"X-Workspace-ID": "student-b"}


def create_student_with_goal(client, headers, goal_id, title="BEM"):
    goal = GOAL | {
        "id": goal_id,
        "title": title,
        "kind": "organisation",
        "start_term": 3,
        "end_term": 4,
    }
    response = client.post("/api/v1/workspace/import", headers=headers, json=payload(goals=[goal]))
    assert response.status_code == 201, response.text
    return response.json()


def test_goal_only_task_and_course_plus_goal_task_persist(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")

    goal_task = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"goal_id": "bem-a", "title": "BEM event proposal", "due_date": "2026-12-03"},
    )
    assert goal_task.status_code == 201, goal_task.text
    body = goal_task.json()
    assert body["course_code"] is None
    assert body["goal_id"] == "bem-a"
    assert body["title"] == "BEM event proposal"
    assert body["due_date"] == "2026-12-03"

    both_task = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"course_code": "C1", "goal_id": "bem-a", "title": "Prepare talk"},
    )
    assert both_task.status_code == 201, both_task.text
    assert both_task.json()["course_code"] == "C1"
    assert both_task.json()["goal_id"] == "bem-a"

    tasks = client.get("/api/v1/study", headers=STUDENT_A).json()["tasks"]
    assert {t["title"] for t in tasks} == {"BEM event proposal", "Prepare talk"}


def test_task_rejects_missing_both_course_and_goal(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    empty = client.post("/api/v1/study/tasks", headers=STUDENT_A, json={"title": "Orphan task"})
    assert empty.status_code == 422

    blank_course = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"course_code": "", "title": "Blank course"},
    )
    assert blank_course.status_code == 422


def test_task_rejects_goal_from_another_workspace(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    create_student_with_goal(client, STUDENT_B, "bem-b")

    cross = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"goal_id": "bem-b", "title": "Wrong workspace goal"},
    )
    assert cross.status_code == 422
    assert cross.json()["detail"]["code"] == "UNKNOWN_GOAL"

    missing = client.post(
        "/api/v1/study/tasks",
        headers=STUDENT_A,
        json={"goal_id": "does-not-exist", "title": "Unknown goal"},
    )
    assert missing.status_code == 422
    assert missing.json()["detail"]["code"] == "UNKNOWN_GOAL"


def test_focus_sessions_still_require_a_course(client):
    create_student_with_goal(client, STUDENT_A, "bem-a")
    response = client.post(
        "/api/v1/study/sessions",
        headers=STUDENT_A,
        json={"id": "12345678-1234-1234-1234-1234567890ab", "seconds": 300, "note": "No course"},
    )
    assert response.status_code == 422
