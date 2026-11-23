from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.curriculum import MAX_TERM, Curriculum

Gpa = Annotated[float, Field(ge=0, le=4, allow_inf_nan=False)] | None
Hours = Annotated[float, Field(ge=0, le=168, allow_inf_nan=False)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Goal(Input):
    """Something the student does beside courses, such as an internship or organisation."""

    # Filled in by the server when missing.
    id: str | None = Field(default=None, pattern=r"^[a-zA-Z0-9-]{1,40}$")
    title: str = Field(min_length=1, max_length=80)
    kind: Literal["internship", "work", "organisation", "graduation", "other"]
    start_term: int = Field(ge=1, le=MAX_TERM)
    end_term: int = Field(ge=1, le=MAX_TERM)
    weekly_hours: Hours

    @model_validator(mode="after")
    def check_terms(self):
        if self.start_term > self.end_term:
            raise ValueError("A goal cannot end before it starts")
        return self


class TimeBudget(Input):
    available_hours: Hours
    # 1 SKS = 50 min face-to-face + 60 structured + 60 independent work per week.
    minutes_per_credit: int = Field(default=170, ge=60, le=300)


Goals = Annotated[list[Goal], Field(max_length=3)]
Mission = Annotated[str, Field(max_length=500)]


def check_goal_ids(goals: list[Goal] | None) -> None:
    given = [goal.id for goal in goals or [] if goal.id]
    if len(given) != len(set(given)):
        raise ValueError("Goal ids must be unique")


class ProfileEdit(Input):
    revision: int = Field(ge=1)
    alias: str = Field(min_length=1, max_length=80)
    current_term: int = Field(ge=1, le=MAX_TERM)
    completed: list[str] = Field(max_length=100)
    last_gpa: Gpa = None
    # Optional: a field that is left out keeps its stored value.
    mission: Mission | None = None
    goals: Goals | None = None
    time_budget: TimeBudget | None = None

    @model_validator(mode="after")
    def check_goals(self):
        check_goal_ids(self.goals)
        return self


class PlanCreate(Input):
    name: str = Field(min_length=1, max_length=100)
    copy_from: str | None = None
    # Lets a solver alternative become its own plan in one request.
    assignments: dict[str, int | None] | None = Field(default=None, max_length=100)


class CanvasPosition(Input):
    x: float = Field(ge=-10000, le=10000, allow_inf_nan=False)
    y: float = Field(ge=0, le=20000, allow_inf_nan=False)
    term: int = Field(ge=1, le=MAX_TERM)


class PlanEdit(Input):
    revision: int = Field(ge=1)
    profile_revision: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=100)
    assignments: dict[str, int | None] = Field(max_length=100)
    layout: dict[str, CanvasPosition] = Field(default_factory=dict, max_length=100)
    failed: list[str] = Field(max_length=100)
    credit_cap: int = Field(ge=1, le=24)
    horizon: int = Field(ge=1, le=MAX_TERM)
    expected_gpa: Gpa = None
    archived: bool = False


class TaskCreate(Input):
    course_code: str | None = None
    goal_id: str | None = Field(default=None, pattern=r"^[a-zA-Z0-9-]{1,40}$")
    title: str = Field(min_length=1, max_length=250)
    due_date: date | None = None

    @model_validator(mode="after")
    def check_target(self):
        if self.course_code == "":
            self.course_code = None
        if not self.course_code and not self.goal_id:
            raise ValueError("Choose a course or a goal")
        return self


class TaskEdit(Input):
    revision: int = Field(ge=1)
    done: bool


class FocusCreate(Input):
    id: str = Field(pattern=r"^[a-zA-Z0-9-]{8,40}$")
    course_code: str
    seconds: int = Field(ge=1, le=43200)
    note: str = Field(max_length=500, default="")


class SolveRequest(Input):
    revision: int = Field(ge=1)
    profile_revision: int = Field(ge=1)


class CurriculumEdit(Input):
    revision: int = Field(ge=1)
    curriculum: Curriculum


class WorkspaceImport(Input):
    alias: str = Field(min_length=1, max_length=80)
    current_term: int = Field(ge=1, le=MAX_TERM)
    last_gpa: Gpa = None
    curriculum: Curriculum
    completed: list[str] = Field(default_factory=list, max_length=100)
    mission: Mission | None = None
    goals: Goals = Field(default_factory=list)
    time_budget: TimeBudget | None = None

    @model_validator(mode="after")
    def check_against_curriculum(self):
        codes = {course.code for course in self.curriculum.courses}
        if len(self.completed) != len(set(self.completed)):
            raise ValueError("Passed courses must be listed once")
        if set(self.completed) - codes:
            raise ValueError("Passed courses must come from this curriculum")
        if any(goal.end_term > self.curriculum.max_terms for goal in self.goals):
            raise ValueError("Goal semesters must be within the maximum study period")
        check_goal_ids(self.goals)
        return self
