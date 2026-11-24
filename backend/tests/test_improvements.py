def test_edit_and_delete_study_task(client):
    headers = {"X-Workspace-ID": "task-crud-a"}
    other = {"X-Workspace-ID": "task-crud-b"}
    client.post("/api/v1/workspace/bootstrap", headers=headers)
    client.post("/api/v1/workspace/bootstrap", headers=other)

    # Add a goal so we can switch a task from course -> goal.
    ws = client.get("/api/v1/workspace", headers=headers).json()
    profile = client.patch(
        "/api/v1/profile",
        headers=headers,
        json={
            "revision": ws["profile"]["revision"],
            "alias": ws["profile"]["alias"],
            "current_term": ws["profile"]["current_term"],
            "completed": ws["profile"]["completed"],
            "goals": [
                {
                    "title": "BEM",
                    "kind": "organisation",
                    "start_term": 3,
                    "end_term": 4,
                    "weekly_hours": 6,
                }
            ],
        },
    ).json()
    goal_id = profile["goals"][0]["id"]

    created = client.post(
        "/api/v1/study/tasks",
        headers=headers,
        json={
            "course_code": "IF2101",
            "title": "Initial title",
            "due_date": "2026-12-10",
            "start_date": "2026-12-08",
            "first_step": "Read notes",
            "details": ["Part 1"],
        },
    ).json()
    assert created["revision"] == 1

    # Partial edit: update title, dates, first_step, details, and switch target to goal.
    edited = client.patch(
        f"/api/v1/study/tasks/{created['id']}",
        headers=headers,
        json={
            "revision": 1,
            "course_code": None,
            "goal_id": goal_id,
            "title": "Updated BEM task",
            "due_date": "2026-12-15",
            "start_date": "2026-12-12",
            "first_step": "Draft agenda",
            "details": ["Bring slides", "Confirm room"],
        },
    )
    assert edited.status_code == 200
    body = edited.json()
    assert body["revision"] == 2
    assert body["course_code"] is None
    assert body["goal_id"] == goal_id
    assert body["title"] == "Updated BEM task"
    assert body["due_date"] == "2026-12-15"
    assert body["start_date"] == "2026-12-12"
    assert body["first_step"] == "Draft agenda"
    assert body["details"] == ["Bring slides", "Confirm room"]
    assert body["done"] is False

    # Invalid edit: removing both targets fails.
    bad_target = client.patch(
        f"/api/v1/study/tasks/{created['id']}",
        headers=headers,
        json={"revision": 2, "goal_id": None},
    )
    assert bad_target.status_code == 422
    assert bad_target.json()["detail"]["code"] == "TASK_TARGET_REQUIRED"

    # Invalid edit: start_date after due_date fails.
    bad_dates = client.patch(
        f"/api/v1/study/tasks/{created['id']}",
        headers=headers,
        json={"revision": 2, "start_date": "2026-12-20"},
    )
    assert bad_dates.status_code == 422
    assert bad_dates.json()["detail"]["code"] == "START_AFTER_DUE"

    # Stale revision returns 409.
    stale = client.patch(
        f"/api/v1/study/tasks/{created['id']}",
        headers=headers,
        json={"revision": 1, "done": True},
    )
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "TASK_CONFLICT"

    # Other workspace cannot delete this task.
    denied = client.delete(f"/api/v1/study/tasks/{created['id']}", headers=other)
    assert denied.status_code == 404
    assert denied.json()["detail"]["code"] == "TASK_NOT_FOUND"

    # Owner deletes the task cleanly.
    deleted = client.delete(f"/api/v1/study/tasks/{created['id']}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": created["id"]}
    assert client.get("/api/v1/study", headers=headers).json()["tasks"] == []


def test_workspace_export_restore_and_delete(client):
    source = {"X-Workspace-ID": "backup-source"}
    restored = {"X-Workspace-ID": "backup-restored"}
    client.post("/api/v1/workspace/bootstrap", headers=source)

    ws = client.get("/api/v1/workspace", headers=source).json()
    profile = client.patch(
        "/api/v1/profile",
        headers=source,
        json={
            "revision": ws["profile"]["revision"],
            "alias": "Nadia",
            "current_term": 3,
            "completed": ws["profile"]["completed"],
            "mission": "Graduate on time with an internship.",
            "time_budget": {"available_hours": 42, "minutes_per_credit": 170},
            "goals": [
                {
                    "title": "Internship",
                    "kind": "internship",
                    "start_term": 6,
                    "end_term": 6,
                    "weekly_hours": 18,
                }
            ],
        },
    ).json()
    goal_id = profile["goals"][0]["id"]

    client.post(
        "/api/v1/study/tasks",
        headers=source,
        json={
            "goal_id": goal_id,
            "title": "Prepare CV",
            "due_date": "2026-12-01",
            "first_step": "List 2 projects",
        },
    )
    client.post(
        "/api/v1/study/sessions",
        headers=source,
        json={
            "id": "session-backup-1",
            "course_code": "IF2101",
            "seconds": 900,
            "note": "Tree traversal",
        },
    )

    exported = client.get("/api/v1/workspace/export", headers=source)
    assert exported.status_code == 200
    bundle = exported.json()
    assert bundle["schema_version"] == 1
    assert bundle["profile"]["alias"] == "Nadia"
    assert len(bundle["plans"]) == 1
    assert len(bundle["tasks"]) == 1
    assert len(bundle["sessions"]) == 1

    # Restoring into a fresh workspace reproduces profile, plans, tasks, and sessions.
    res = client.post("/api/v1/workspace/restore", headers=restored, json=bundle)
    assert res.status_code == 201
    restored_ws = res.json()
    assert restored_ws["profile"]["alias"] == "Nadia"
    assert restored_ws["profile"]["mission"] == "Graduate on time with an internship."
    assert len(restored_ws["plans"]) == 1

    study = client.get("/api/v1/study", headers=restored).json()
    assert len(study["tasks"]) == 1
    assert study["tasks"][0]["title"] == "Prepare CV"
    assert study["tasks"][0]["goal_id"] == goal_id
    assert len(study["sessions"]) == 1
    assert study["sessions"][0]["seconds"] == 900

    # Restoring onto an existing workspace ID is rejected.
    dup = client.post("/api/v1/workspace/restore", headers=restored, json=bundle)
    assert dup.status_code == 409

    # Deleting source workspace removes its records without touching the restored copy.
    removed = client.delete("/api/v1/workspace", headers=source)
    assert removed.status_code == 200
    assert removed.json() == {"deleted": "backup-source"}
    assert client.get("/api/v1/workspace", headers=source).json()["profile"] is None
    assert client.get("/api/v1/workspace", headers=restored).json()["profile"]["alias"] == "Nadia"
