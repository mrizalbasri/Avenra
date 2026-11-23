"""Weekly time budget caps SKS per semester across rules, solver, diagnosis, and outlook."""

from types import SimpleNamespace

from app.curriculum import Curriculum, load_demo_curriculum
from app.rules import term_caps
from app.solver import _feasible, diagnose, outlook, solve_plans
from app.validation import validate_plan
from tests.conftest import editable


def edit_profile(client, profile, **changes):
    body = {
        "revision": profile["revision"],
        "alias": profile["alias"],
        "current_term": profile["current_term"],
        "completed": profile["completed"],
        "last_gpa": profile["last_gpa"],
    } | changes
    response = client.patch("/api/v1/profile", json=body)
    assert response.status_code == 200, response.text
    return response.json()


def make_tight_curriculum():
    """Four terms (3..6) with 36 credits remaining, 9 credits per term needed to finish by 6."""
    courses = []
    for term in range(3, 7):
        for i in range(1, 4):
            courses.append(
                {
                    "code": f"T{term}C{i}",
                    "name": f"Term {term} Course {i}",
                    "credits": 3,
                    "recommended_term": term,
                    "prerequisites": [],
                    "offered_terms": [0, 1],
                }
            )
    return Curriculum.model_validate(
        {
            "id": "tight",
            "name": "Tight curriculum",
            "version": "2026",
            "status": "user_supplied",
            "disclaimer": "User-supplied.",
            "source": "Test",
            "credit_cap": 24,
            "graduation_credits": 36,
            "max_terms": 8,
            "target_terms": 6,
            "gpa_credit_rules": [],
            "courses": courses,
        }
    )


def test_term_caps_follow_available_hours_and_active_goals():
    curriculum = load_demo_curriculum()
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=3.5,
        revision=1,
        time_budget={"available_hours": 45, "minutes_per_credit": 170},
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 20,
            },
            {
                "id": "bem",
                "title": "BEM",
                "kind": "organisation",
                "start_term": 5,
                "end_term": 6,
                "weekly_hours": 10,
            },
        ],
    )
    plan = SimpleNamespace(credit_cap=24, horizon=8, expected_gpa=None)

    caps = term_caps(curriculum, profile, plan, [3, 4, 5, 6, 7])
    # 45 h * 60 / 170 = 15.88 -> 15 SKS
    assert caps[3]["cap"] == 15
    assert caps[3]["code"] == "TIME_BUDGET"
    assert caps[3]["params"] == {"hours": 45, "available": 45, "minutes_per_credit": 170}
    assert caps[4]["cap"] == 15
    # Semester 5: (45 - 10) * 60 / 170 = 12.35 -> 12 SKS
    assert caps[5]["cap"] == 12
    assert caps[5]["params"]["hours"] == 35
    # Semester 6: (45 - 30) * 60 / 170 = 5.29 -> 5 SKS
    assert caps[6]["cap"] == 5
    assert caps[6]["params"]["hours"] == 15
    # Semester 7: back to 45 h -> 15 SKS
    assert caps[7]["cap"] == 15


def test_term_caps_clamp_at_zero_when_goals_exceed_available_hours():
    curriculum = load_demo_curriculum()
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=3.5,
        revision=1,
        time_budget={"available_hours": 20, "minutes_per_credit": 170},
        goals=[
            {
                "id": "job",
                "title": "Full-time work",
                "kind": "work",
                "start_term": 4,
                "end_term": 4,
                "weekly_hours": 35,
            }
        ],
    )
    plan = SimpleNamespace(credit_cap=24, horizon=8, expected_gpa=None)
    caps = term_caps(curriculum, profile, plan, [4])
    assert caps[4]["cap"] == 0
    assert caps[4]["code"] == "TIME_BUDGET"
    assert caps[4]["params"]["hours"] == 0


def test_without_time_budget_caps_and_assumptions_are_unchanged():
    curriculum = load_demo_curriculum()
    profile = SimpleNamespace(
        current_term=3,
        completed=[c.code for c in curriculum.courses if c.recommended_term < 3],
        last_gpa=3.1,
        revision=1,
        time_budget=None,
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 20,
            }
        ],
    )
    plan = SimpleNamespace(
        assignments={
            c.code: c.recommended_term for c in curriculum.courses if c.recommended_term >= 3
        },
        failed=[],
        credit_cap=24,
        horizon=8,
        expected_gpa=None,
        revision=1,
    )
    validation = validate_plan(curriculum, profile, plan)
    assert validation["caps"][6] == 24
    assert validation["cap_details"][6] == {"code": "CURRICULUM_MAX", "params": {}}
    assert all(item["code"] != "TIME_BUDGET" for item in validation["assumption_items"])


def test_validation_reports_time_budget_finding_and_assumption(client, workspace):
    profile = edit_profile(
        client,
        workspace["profile"],
        time_budget={"available_hours": 45, "minutes_per_credit": 170},
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 20,
            }
        ],
    )
    plan = client.get(f"/api/v1/plans/{workspace['plans'][0]['id']}").json()["plan"]
    validation = plan["validation"]
    assert validation["caps"]["6"] == 8
    assert validation["cap_details"]["6"] == {
        "code": "TIME_BUDGET",
        "params": {"hours": 25, "available": 45, "minutes_per_credit": 170},
    }
    cap_finding = next(
        f for f in validation["findings"] if f["rule"] == "CREDIT_CAP" and f["params"]["term"] == 6
    )
    assert cap_finding["params"]["reason"] == "TIME_BUDGET"
    assert cap_finding["params"]["hours"] == 25
    assumption = next(
        item for item in validation["assumption_items"] if item["code"] == "TIME_BUDGET"
    )
    assert assumption["params"] == {"available": 45, "minutes_per_credit": 170}
    assert "170" in assumption["message"]
    assert profile["revision"] == 2


def test_solver_respects_weekly_time_budget_in_every_term():
    curriculum = make_tight_curriculum()
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=None,
        revision=1,
        mission=None,
        time_budget={"available_hours": 45, "minutes_per_credit": 170},
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 30,
            }
        ],
    )
    # Semester 6 cap = floor(15 * 60 / 170) = 5 SKS (at most one 3-SKS course).
    # Other semesters have cap 15 SKS, so all 36 SKS still fit in semesters 3..6.
    plan = SimpleNamespace(
        assignments={c.code: c.recommended_term for c in curriculum.courses},
        failed=[],
        credit_cap=24,
        horizon=6,
        expected_gpa=None,
        revision=1,
    )
    result = solve_plans(curriculum, profile, plan)
    assert result["status"] == "feasible"
    for alt in result["alternatives"]:
        assert alt["validation"]["findings"] == []
        assert alt["validation"]["loads"][6] <= 5


def test_diagnose_bounds_credit_cap_and_suggests_reducing_goal_hours():
    curriculum = make_tight_curriculum()
    # 36 credits across 4 terms; available = 30 h/week -> 10 SKS/term (cap 10).
    # Internship in semester 6 takes 20 h/week -> 10 h left -> 3 SKS cap in semester 6.
    # Total capacity = 10 + 10 + 10 + 3 = 33 < 36 (infeasible at horizon 6).
    # 3+3+3=9 credits in each term needs 9 SKS in semester 6 -> 9*170/60 = 25.5 h -> goal <= 4 h/wk.
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=None,
        revision=1,
        mission=None,
        time_budget={"available_hours": 30, "minutes_per_credit": 170},
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 20,
            }
        ],
    )
    # Plan cap is 9, curriculum cap is 24, budget max cap is 10.
    # Raising plan cap to 10 still only gives 9+9+9+3 = 30 (since courses are 3 credits),
    # so credit_cap suggestion must NOT be shown (must stay bounded by budget <= 10).
    plan = SimpleNamespace(
        assignments={c.code: c.recommended_term for c in curriculum.courses},
        failed=[],
        credit_cap=9,
        horizon=6,
        expected_gpa=None,
        revision=1,
    )
    diag = diagnose(curriculum, profile, plan)
    reason_codes = {r["code"] for r in diag["reasons"]}
    assert "TIME_BUDGET" in reason_codes
    budget_reason = next(r for r in diag["reasons"] if r["code"] == "TIME_BUDGET")
    assert budget_reason["params"] == {"term": 6, "cap": 3, "hours": 10}

    # credit_cap must not exceed budget cap (no infeasible suggestion above budget)
    assert all(s["kind"] != "credit_cap" for s in diag["suggestions"])

    goal_suggestion = next(s for s in diag["suggestions"] if s["kind"] == "goal_hours")
    assert goal_suggestion["code"] == "GOAL_HOURS"
    assert goal_suggestion["params"]["goal"] == "Internship"
    assert goal_suggestion["params"]["term"] == 6
    assert goal_suggestion["params"]["goal_id"] == "intern"
    suggested = goal_suggestion["value"]
    assert 0 <= suggested < 20
    # Re-verify feasibility at suggested hours and infeasibility at suggested + 1.
    updated_goals = [profile.goals[0] | {"weekly_hours": suggested}]
    assert _feasible(
        curriculum, SimpleNamespace(**(profile.__dict__ | {"goals": updated_goals})), plan
    )
    tighter_goals = [profile.goals[0] | {"weekly_hours": suggested + 1}]
    assert not _feasible(
        curriculum, SimpleNamespace(**(profile.__dict__ | {"goals": tighter_goals})), plan
    )


def test_diagnose_credit_cap_suggestion_respects_budget_bound():
    curriculum = make_tight_curriculum()
    # Available 35 h/week -> 12 SKS/term (4 * 12 = 48 >= 36). Plan cap is 6 (4 * 6 = 24 < 36).
    # Suggesting credit_cap = 9 is within budget cap (12) and makes it feasible.
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=None,
        revision=1,
        mission=None,
        time_budget={"available_hours": 35, "minutes_per_credit": 170},
        goals=[],
    )
    plan = SimpleNamespace(
        assignments={c.code: c.recommended_term for c in curriculum.courses},
        failed=[],
        credit_cap=6,
        horizon=6,
        expected_gpa=None,
        revision=1,
    )
    diag = diagnose(curriculum, profile, plan)
    cap_suggestion = next(s for s in diag["suggestions"] if s["kind"] == "credit_cap")
    assert cap_suggestion["value"] == 9
    assert cap_suggestion["value"] <= 12


def test_diagnose_suggests_goal_hours_range_for_multi_semester_goal():
    curriculum = make_tight_curriculum()
    profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=None,
        revision=1,
        mission=None,
        time_budget={"available_hours": 30, "minutes_per_credit": 170},
        goals=[
            {
                "id": "bem",
                "title": "BEM",
                "kind": "organisation",
                "start_term": 5,
                "end_term": 6,
                "weekly_hours": 15,
            }
        ],
    )
    plan = SimpleNamespace(
        assignments={c.code: c.recommended_term for c in curriculum.courses},
        failed=[],
        credit_cap=12,
        horizon=6,
        expected_gpa=None,
        revision=1,
    )
    diag = diagnose(curriculum, profile, plan)
    goal_suggestion = next(s for s in diag["suggestions"] if s["kind"] == "goal_hours")
    assert goal_suggestion["code"] == "GOAL_HOURS_RANGE"
    assert goal_suggestion["params"]["start_term"] == 5
    assert goal_suggestion["params"]["end_term"] == 6
    assert goal_suggestion["params"]["hours"] == goal_suggestion["value"]


def test_outlook_moves_later_when_internship_reduces_semester_6_cap(client, workspace):
    plan = workspace["plans"][0]
    before = client.get(f"/api/v1/plans/{plan['id']}/outlook").json()
    assert (before["status"], before["completion_term"]) == ("on_track", 8)

    # 55 h/week -> 19 SKS/semester normally, enough to finish in 8 semesters.
    # Adding a 20 h/week internship in semester 6 leaves 35 h -> 12 SKS in semester 6.
    # With 45 h/week -> 15 SKS/semester and 20 h internship -> 8 SKS in semester 6,
    # total capacity across semesters 3..8 is 15*5 + 8 = 83 < 108 credits remaining,
    # so graduation moves past semester 8.
    edit_profile(
        client,
        workspace["profile"],
        time_budget={"available_hours": 45, "minutes_per_credit": 170},
        goals=[
            {
                "id": "intern",
                "title": "Internship",
                "kind": "internship",
                "start_term": 6,
                "end_term": 6,
                "weekly_hours": 20,
            }
        ],
    )
    after = client.get(f"/api/v1/plans/{plan['id']}/outlook").json()
    assert after["status"] == "late"
    assert after["completion_term"] > 8
    assert after["delay"] == after["completion_term"] - 8

    # Also verify direct outlook helper on a curriculum where only semester 6 triggers delay.
    curriculum = make_tight_curriculum()
    base_profile = SimpleNamespace(
        current_term=3,
        completed=[],
        last_gpa=None,
        revision=1,
        mission=None,
        time_budget={"available_hours": 30, "minutes_per_credit": 170},
        goals=[],
    )
    tight_plan = SimpleNamespace(
        assignments={c.code: c.recommended_term for c in curriculum.courses},
        failed=[],
        credit_cap=12,
        horizon=6,
        expected_gpa=None,
        revision=1,
    )
    on_time = outlook(curriculum, base_profile, tight_plan)
    assert (on_time["status"], on_time["completion_term"]) == ("on_track", 6)

    with_intern = SimpleNamespace(
        **(
            base_profile.__dict__
            | {
                "goals": [
                    {
                        "id": "intern",
                        "title": "Internship",
                        "kind": "internship",
                        "start_term": 6,
                        "end_term": 6,
                        "weekly_hours": 20,
                    }
                ]
            }
        )
    )
    delayed = outlook(curriculum, with_intern, tight_plan)
    assert (delayed["status"], delayed["completion_term"]) == ("late", 7)

    # Confirm plan endpoint still works cleanly with updated profile revision
    refreshed = client.get(f"/api/v1/plans/{plan['id']}").json()["plan"]
    assert refreshed["validation"]["caps"]["6"] == 8
    # Keep editable import used for sanity check
    assert editable(refreshed)["horizon"] == 8
