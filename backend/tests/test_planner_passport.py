from tests.conftest import editable


def test_pinned_courses_locked_across_recovery_alternatives(client):
    headers = {"X-Workspace-ID": "pin-solve-ws"}
    ws = client.post("/api/v1/workspace/bootstrap", headers=headers).json()
    plan = ws["plans"][0]

    # Pin IF3204 (even-term leaf course) to semester 8 while failing IF2101.
    # Without the pin, Earlier completion places IF3204 earlier to minimize term sum.
    saved = client.patch(
        f"/api/v1/plans/{plan['id']}",
        headers=headers,
        json=editable(plan)
        | {
            "assignments": plan["assignments"] | {"IF3204": 8},
            "failed": ["IF2101"],
            "pinned": ["IF3204"],
            "horizon": 9,
        },
    )
    assert saved.status_code == 200, saved.text
    saved_plan = saved.json()
    assert saved_plan["pinned"] == ["IF3204"]

    solved = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        headers=headers,
        json={"revision": saved_plan["revision"], "profile_revision": 1},
    )
    assert solved.status_code == 200, solved.text
    body = solved.json()
    assert body["status"] == "feasible"
    assert len(body["alternatives"]) >= 1
    for alt in body["alternatives"]:
        assert alt["assignments"]["IF3204"] == 8
        assert alt["validation"]["findings"] == []


def test_pinned_conflict_diagnoses_and_outlook_ignores_pins_with_cache(client):
    headers = {"X-Workspace-ID": "pin-diag-ws"}
    ws = client.post("/api/v1/workspace/bootstrap", headers=headers).json()
    plan = ws["plans"][0]

    # Pinning IF2201 (even-only course depending on IF2101) into semester 3 fails solving.
    saved = client.patch(
        f"/api/v1/plans/{plan['id']}",
        headers=headers,
        json=editable(plan)
        | {
            "assignments": plan["assignments"] | {"IF2201": 3},
            "pinned": ["IF2201"],
        },
    ).json()

    solved = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        headers=headers,
        json={"revision": saved["revision"], "profile_revision": 1},
    ).json()
    assert solved["status"] == "infeasible"
    reasons = {r["rule"]: r for r in solved["diagnosis"]["reasons"]}
    assert "PINNED_COURSES" in reasons
    assert reasons["PINNED_COURSES"]["code"] == "PINNED_COURSES"
    assert reasons["PINNED_COURSES"]["params"] == {"courses": ["IF2201"]}

    suggestions = {s["kind"]: s for s in solved["diagnosis"]["suggestions"]}
    assert "unpin" in suggestions
    assert suggestions["unpin"]["code"] == "UNPIN_COURSES"
    assert suggestions["unpin"]["params"] == {"courses": ["IF2201"]}

    # Outlook simulates recovery freely without saved pins, and repeated calls hit cache cleanly.
    first_outlook = client.get(f"/api/v1/plans/{plan['id']}/outlook", headers=headers)
    second_outlook = client.get(f"/api/v1/plans/{plan['id']}/outlook", headers=headers)
    assert first_outlook.status_code == 200
    assert second_outlook.status_code == 200
    assert first_outlook.json() == second_outlook.json()
    assert first_outlook.json()["status"] == "on_track"
    assert first_outlook.json()["earliest_term"] == 8


def test_primary_plan_selection_archive_promotion_and_delete(client):
    headers = {"X-Workspace-ID": "primary-plan-ws"}
    other = {"X-Workspace-ID": "primary-plan-other"}
    client.post("/api/v1/workspace/bootstrap", headers=other)
    ws = client.post("/api/v1/workspace/bootstrap", headers=headers).json()
    first = ws["plans"][0]
    assert first["is_primary"] is True

    second = client.post(
        "/api/v1/plans",
        headers=headers,
        json={"name": "Internship plan", "copy_from": first["id"]},
    ).json()
    assert second["is_primary"] is False

    # Cross-workspace primary toggle or delete is denied.
    assert client.post(f"/api/v1/plans/{second['id']}/primary", headers=other).status_code == 404
    assert client.delete(f"/api/v1/plans/{second['id']}", headers=other).status_code == 404

    # Promote second plan as primary.
    promoted = client.post(f"/api/v1/plans/{second['id']}/primary", headers=headers)
    assert promoted.status_code == 200, promoted.text
    assert promoted.json()["is_primary"] is True

    plans = {p["id"]: p for p in client.get("/api/v1/workspace", headers=headers).json()["plans"]}
    assert plans[first["id"]]["is_primary"] is False
    assert plans[second["id"]]["is_primary"] is True

    # Archiving the primary plan promotes the remaining active plan, and archived cannot be primary.
    archived = client.patch(
        f"/api/v1/plans/{second['id']}",
        headers=headers,
        json=editable(plans[second["id"]]) | {"archived": True},
    ).json()
    assert archived["archived"] is True
    assert archived["is_primary"] is False

    deny_archived = client.post(f"/api/v1/plans/{second['id']}/primary", headers=headers)
    assert deny_archived.status_code == 422
    assert deny_archived.json()["detail"]["code"] == "PRIMARY_ARCHIVED"

    plans = {p["id"]: p for p in client.get("/api/v1/workspace", headers=headers).json()["plans"]}
    assert plans[first["id"]]["is_primary"] is True

    # Deleting the primary plan promotes the oldest active plan.
    third = client.post(
        "/api/v1/plans",
        headers=headers,
        json={"name": "Third plan", "copy_from": first["id"]},
    ).json()
    assert third["is_primary"] is False
    deleted = client.delete(f"/api/v1/plans/{first['id']}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": first["id"]}

    remaining = client.get("/api/v1/workspace", headers=headers).json()["plans"]
    active = [p for p in remaining if not p["archived"]]
    assert len(active) == 1
    assert active[0]["id"] == third["id"]
    assert active[0]["is_primary"] is True


def test_goal_focus_sessions_and_backup_roundtrip(client):
    headers = {"X-Workspace-ID": "goal-focus-src"}
    dst_headers = {"X-Workspace-ID": "goal-focus-dst"}
    ws = client.post("/api/v1/workspace/bootstrap", headers=headers).json()
    profile = client.patch(
        "/api/v1/profile",
        headers=headers,
        json={
            "revision": ws["profile"]["revision"],
            "alias": "Ayu",
            "current_term": 3,
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
    plan = ws["plans"][0]
    client.patch(
        f"/api/v1/plans/{plan['id']}",
        headers=headers,
        json=editable(plan, profile_revision=profile["revision"])
        | {"assignments": plan["assignments"] | {"IF3204": 8}, "pinned": ["IF3204"]},
    )

    # Requires either course_code or goal_id.
    empty_target = client.post(
        "/api/v1/study/sessions",
        headers=headers,
        json={"id": "focus-empty-1", "seconds": 300, "note": "Missing target"},
    )
    assert empty_target.status_code == 422

    # Unknown goal_id is rejected.
    bad_goal = client.post(
        "/api/v1/study/sessions",
        headers=headers,
        json={"id": "focus-bad-goal", "goal_id": "nonexistent", "seconds": 300, "note": ""},
    )
    assert bad_goal.status_code == 422
    assert bad_goal.json()["detail"]["code"] == "UNKNOWN_GOAL"

    # Valid goal-only focus session persists.
    created = client.post(
        "/api/v1/study/sessions",
        headers=headers,
        json={
            "id": "focus-bem-001",
            "course_code": None,
            "goal_id": goal_id,
            "seconds": 900,
            "note": "Drafted BEM proposal",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["course_code"] is None
    assert body["goal_id"] == goal_id

    # Export and restore keep pins, primary flag, and goal-only focus sessions.
    bundle = client.get("/api/v1/workspace/export", headers=headers).json()
    assert bundle["plans"][0]["pinned"] == ["IF3204"]
    assert bundle["plans"][0]["is_primary"] is True
    assert bundle["sessions"][0]["course_code"] is None
    assert bundle["sessions"][0]["goal_id"] == goal_id

    restored = client.post("/api/v1/workspace/restore", headers=dst_headers, json=bundle)
    assert restored.status_code == 201, restored.text
    restored_plan = restored.json()["plans"][0]
    assert restored_plan["pinned"] == ["IF3204"]
    assert restored_plan["is_primary"] is True
    restored_sessions = client.get("/api/v1/study", headers=dst_headers).json()["sessions"]
    assert len(restored_sessions) == 1
    assert restored_sessions[0]["course_code"] is None
    assert restored_sessions[0]["goal_id"] == goal_id
