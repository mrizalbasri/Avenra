from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.curriculum import MAX_TERM, Course, Curriculum, load_demo_curriculum
from app.database import get_session
from app.models import FocusSession, Plan, Profile, StudyTask, new_id
from app.schemas import (
    FocusCreate,
    PlanCreate,
    PlanEdit,
    ProfileEdit,
    SolveRequest,
    TaskCreate,
    TaskEdit,
    WorkspaceImport,
)
from app.solver import outlook, solve_plans
from app.validation import bottlenecks, validate_plan

router = APIRouter(prefix="/api/v1")
DB = Annotated[Session, Depends(get_session)]
DEMO_ID = "local-demo"


def fail(status: int, code: str, message: str, **params) -> NoReturn:
    """Raise an error whose body is {code, message, params}.

    `message` is the English default. Clients translate from `code` and `params`.
    """
    raise HTTPException(status, {"code": code, "message": message, "params": params})


def row(item) -> dict:
    return {column.name: getattr(item, column.name) for column in item.__table__.columns}


def workspace_key(db):
    return db.info.get("workspace_id", DEMO_ID)


def curriculum_for(profile):
    if profile and profile.curriculum:
        return Curriculum.model_validate(profile.curriculum)
    return load_demo_curriculum(legacy=profile is not None)


def profile_or_404(db):
    profile = db.get(Profile, workspace_key(db))
    if not profile:
        fail(404, "PROFILE_NOT_FOUND", "Open the synthetic demo workspace first.")
    return profile


def plan_or_404(db, plan_id):
    plan = db.get(Plan, plan_id)
    if not plan or plan.profile_id != workspace_key(db):
        fail(404, "PLAN_NOT_FOUND", "Plan not found.")
    return plan


def known_codes(db, codes):
    supported = {c.code for c in curriculum_for(profile_or_404(db)).courses}
    if len(codes) != len(set(codes)) or set(codes) - supported:
        fail(422, "UNKNOWN_COURSES", "Use unique course codes from the selected curriculum.")


def plan_response(plan, profile):
    curriculum = curriculum_for(profile)
    return {
        **row(plan),
        "validation": validate_plan(curriculum, profile, plan),
        "bottlenecks": bottlenecks(curriculum, plan.failed, profile.completed),
    }


def next_offered(course: Course, term: int) -> int:
    while term % 2 not in course.offered_terms:
        term += 1
    return term


def default_assignments(curriculum: Curriculum, completed: list[str], current_term: int) -> dict:
    """Recommended semesters for required courses, plus electives until graduation credits."""
    done = set(completed)
    open_courses = [c for c in curriculum.courses if c.code not in done]
    credits = sum(c.credits for c in curriculum.courses if c.code in done)
    credits += sum(c.credits for c in open_courses if c.category == "required")
    target = curriculum.graduation_credits or 0
    assignments = {}
    for course in open_courses:
        if course.category == "elective" and credits >= target:
            continue
        if course.category == "elective":
            credits += course.credits
        assignments[course.code] = next_offered(course, max(current_term, course.recommended_term))
    return assignments


def check_assignment_terms(assignments):
    if any(term is not None and not 1 <= term <= MAX_TERM for term in assignments.values()):
        fail(
            422,
            "TERM_OUT_OF_RANGE",
            f"Semester assignments must be between 1 and {MAX_TERM}.",
            max=MAX_TERM,
        )


def progress_issues(curriculum: Curriculum, completed: list[str]) -> list[dict]:
    """Completed courses whose own prerequisites are not marked completed.

    A missing either-or group is listed as a list of its options.
    """
    done = set(completed)
    issues = []
    for course in curriculum.courses:
        if course.code not in done:
            continue
        missing = [p for p in [*course.prerequisites, *course.corequisites] if p not in done]
        missing += [list(g) for g in course.any_prerequisites if not set(g) & done]
        if missing:
            issues.append({"course": course.code, "missing": missing})
    return issues


def issue_text(issue: dict) -> str:
    missing = ", ".join(m if isinstance(m, str) else " or ".join(m) for m in issue["missing"])
    return f"{issue['course']} needs {missing}"


def check_progress(curriculum: Curriculum, completed: list[str]) -> None:
    issues = progress_issues(curriculum, completed)
    if issues:
        fail(
            422,
            "PROGRESS_ISSUES",
            "Some completed courses are missing their prerequisites: "
            + "; ".join(issue_text(i) for i in issues[:4])
            + ". Mark the prerequisites as completed, or ask your advisor about an exemption.",
            issues=issues[:4],
        )


def stored_goals(goals) -> list[dict]:
    """Goals as saved: every goal gets a stable id so tasks can refer to it."""
    return [goal.model_dump() | {"id": goal.id or new_id()} for goal in goals]


@router.get("/workspace")
def workspace(db: DB):
    profile = db.get(Profile, workspace_key(db))
    plans = db.scalars(
        select(Plan).where(Plan.profile_id == workspace_key(db)).order_by(Plan.created_at)
    ).all()
    return {
        "profile": row(profile) if profile else None,
        "plans": [plan_response(plan, profile) for plan in plans],
        "curriculum": curriculum_for(profile).model_dump(),
    }


@router.get("/curriculum/example")
def example_curriculum():
    """The synthetic curriculum, so a new student can start from an example table."""
    return load_demo_curriculum().model_dump()


@router.post("/workspace/bootstrap")
def bootstrap(db: DB):
    # The fixed ID makes opening the local synthetic workspace repeatable.
    curriculum = load_demo_curriculum()
    if not db.get(Profile, workspace_key(db)):
        # A fictional student starting semester 3 with semesters 1 and 2 passed.
        db.add(
            Profile(
                id=workspace_key(db),
                alias="Alex | Demo student",
                current_term=3,
                completed=[c.code for c in curriculum.courses if c.recommended_term < 3],
                last_gpa=3.1,
                curriculum=curriculum.model_dump(),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    profile = profile_or_404(db)
    if not db.scalar(select(Plan.id).where(Plan.profile_id == workspace_key(db)).limit(1)):
        curriculum = curriculum_for(profile)
        db.add(
            Plan(
                id="demo-main" if workspace_key(db) == DEMO_ID else workspace_key(db),
                profile_id=workspace_key(db),
                name="My study plan",
                assignments=default_assignments(
                    curriculum, profile.completed, profile.current_term
                ),
                failed=[],
                credit_cap=curriculum.credit_cap,
                horizon=min(curriculum.max_terms, max(8, profile.current_term)),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    return workspace(db)


@router.patch("/profile")
def edit_profile(payload: ProfileEdit, db: DB):
    known_codes(db, payload.completed)
    curriculum = curriculum_for(profile_or_404(db))
    check_progress(curriculum, payload.completed)
    # Fields left out of the request keep their stored values.
    values = payload.model_dump(exclude={"revision", "goals"}, exclude_unset=True)
    if payload.goals is not None:
        if any(goal.end_term > curriculum.max_terms for goal in payload.goals):
            fail(
                422,
                "GOAL_TERM_RANGE",
                "Goal semesters must be within the maximum study period of "
                f"{curriculum.max_terms} semesters.",
                max=curriculum.max_terms,
            )
        values["goals"] = stored_goals(payload.goals)
    result = db.execute(
        update(Profile)
        .where(Profile.id == workspace_key(db), Profile.revision == payload.revision)
        .values(**values, revision=payload.revision + 1)
    )
    if not result.rowcount:
        db.rollback()
        fail(409, "PROFILE_CONFLICT", "The profile changed in another tab. Reload before saving.")
    db.commit()
    return row(profile_or_404(db))


@router.post("/plans", status_code=201)
def create_plan(payload: PlanCreate, db: DB):
    profile = profile_or_404(db)
    curriculum = curriculum_for(profile)
    if payload.copy_from:
        source = plan_or_404(db, payload.copy_from)
        values = {
            key: getattr(source, key)
            for key in ("assignments", "layout", "failed", "credit_cap", "horizon", "expected_gpa")
        }
    else:
        values = {
            "credit_cap": curriculum.credit_cap,
            "horizon": min(curriculum.max_terms, max(8, profile.current_term)),
            "assignments": default_assignments(curriculum, profile.completed, profile.current_term),
        }
    if payload.assignments is not None:
        known_codes(db, list(payload.assignments))
        check_assignment_terms(payload.assignments)
        values["assignments"] = payload.assignments
        # Saved positions belong to the old arrangement.
        values["layout"] = {}
    plan = Plan(profile_id=profile.id, name=payload.name, **values)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan_response(plan, profile)


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, db: DB):
    return {
        "plan": plan_response(plan_or_404(db, plan_id), profile_or_404(db)),
        "profile": row(profile_or_404(db)),
        "curriculum": curriculum_for(profile_or_404(db)).model_dump(),
    }


@router.patch("/plans/{plan_id}")
def edit_plan(plan_id: str, payload: PlanEdit, db: DB):
    plan_or_404(db, plan_id)
    profile = profile_or_404(db)
    if profile.revision != payload.profile_revision:
        fail(
            409, "PROFILE_CHANGED", "The academic profile changed. Reload before saving this plan."
        )
    known_codes(db, list(payload.assignments))
    known_codes(db, list(payload.layout))
    known_codes(db, payload.failed)
    check_assignment_terms(payload.assignments)
    if payload.horizon < profile.current_term:
        fail(
            422,
            "HORIZON_BEFORE_CURRENT",
            "The planning horizon cannot end before the current semester.",
        )
    result = db.execute(
        update(Plan)
        .where(
            Plan.id == plan_id,
            Plan.profile_id == workspace_key(db),
            Plan.revision == payload.revision,
        )
        .values(
            **payload.model_dump(exclude={"revision", "profile_revision"}),
            revision=payload.revision + 1,
        )
    )
    if not result.rowcount:
        db.rollback()
        fail(
            409,
            "PLAN_CONFLICT",
            "This plan changed in another tab. Reload before saving your draft.",
        )
    db.commit()
    return plan_response(plan_or_404(db, plan_id), profile)


@router.get("/plans/{plan_id}/outlook")
def plan_outlook(plan_id: str, db: DB):
    """Graduation timing and critical courses for a saved plan."""
    plan = plan_or_404(db, plan_id)
    profile = profile_or_404(db)
    return outlook(curriculum_for(profile), profile, plan)


@router.post("/plans/{plan_id}/solve")
def solve(plan_id: str, payload: SolveRequest, db: DB):
    plan = plan_or_404(db, plan_id)
    profile = profile_or_404(db)
    if plan.revision != payload.revision or profile.revision != payload.profile_revision:
        fail(
            409,
            "SOLVE_CONFLICT",
            "The source plan or profile changed. Reload before generating alternatives.",
        )
    return solve_plans(curriculum_for(profile), profile, plan)


@router.get("/study")
def study(db: DB):
    profile_or_404(db)
    tasks = db.scalars(
        select(StudyTask)
        .where(StudyTask.profile_id == workspace_key(db))
        .order_by(StudyTask.created_at.desc())
    ).all()
    sessions = db.scalars(
        select(FocusSession)
        .where(FocusSession.profile_id == workspace_key(db))
        .order_by(FocusSession.created_at.desc())
        .limit(200)
    ).all()
    return {
        "tasks": [row(task) for task in tasks],
        "sessions": [row(session) for session in sessions],
    }


@router.post("/study/tasks", status_code=201)
def add_task(payload: TaskCreate, db: DB):
    profile = profile_or_404(db)
    if payload.course_code:
        known_codes(db, [payload.course_code])
    if payload.goal_id:
        goal_ids = {goal.get("id") for goal in (profile.goals or [])}
        if payload.goal_id not in goal_ids:
            fail(422, "UNKNOWN_GOAL", "Choose a goal from this workspace.")
    values = payload.model_dump()
    values["due_date"] = payload.due_date.isoformat() if payload.due_date else None
    task = StudyTask(profile_id=workspace_key(db), **values)
    db.add(task)
    db.commit()
    db.refresh(task)
    return row(task)


@router.patch("/study/tasks/{task_id}")
def edit_task(task_id: str, payload: TaskEdit, db: DB):
    result = db.execute(
        update(StudyTask)
        .where(
            StudyTask.id == task_id,
            StudyTask.profile_id == workspace_key(db),
            StudyTask.revision == payload.revision,
        )
        .values(done=payload.done, revision=payload.revision + 1)
    )
    if not result.rowcount:
        db.rollback()
        fail(409, "TASK_CONFLICT", "Task changed. Reload before trying again.")
    db.commit()
    return row(db.get(StudyTask, task_id))


@router.post("/study/sessions", status_code=201)
def add_focus(payload: FocusCreate, db: DB):
    profile_or_404(db)
    known_codes(db, [payload.course_code])
    existing = db.get(FocusSession, payload.id)
    if existing:
        if existing.profile_id != workspace_key(db):
            fail(404, "SESSION_NOT_FOUND", "Session not found")
        return row(existing)
    session = FocusSession(profile_id=workspace_key(db), **payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return row(session)


@router.post("/workspace/import", status_code=201)
def import_workspace(payload: WorkspaceImport, db: DB):
    if db.get(Profile, workspace_key(db)):
        fail(409, "WORKSPACE_EXISTS", "Choose a new workspace for a different curriculum.")
    curriculum = payload.curriculum.model_copy(
        update={
            "status": "user_supplied",
            "disclaimer": "User-supplied curriculum. Verify rules with your university.",
        }
    )
    check_progress(curriculum, payload.completed)
    profile = Profile(
        id=workspace_key(db),
        alias=payload.alias,
        current_term=payload.current_term,
        completed=payload.completed,
        last_gpa=payload.last_gpa,
        curriculum=curriculum.model_dump(),
        mission=payload.mission,
        goals=stored_goals(payload.goals),
        time_budget=payload.time_budget.model_dump() if payload.time_budget else None,
    )
    db.add(profile)
    try:
        # The plan's foreign key needs the profile row first; no ORM relationship orders it.
        db.flush()
    except IntegrityError:
        db.rollback()
        fail(409, "WORKSPACE_EXISTS", "Choose a new workspace for a different curriculum.")
    plan = Plan(
        profile_id=profile.id,
        name="My study plan",
        credit_cap=curriculum.credit_cap,
        horizon=min(curriculum.max_terms, max(8, payload.current_term)),
        assignments=default_assignments(curriculum, payload.completed, payload.current_term),
    )
    db.add(plan)
    db.commit()
    return workspace(db)
