from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.curriculum import MAX_TERM, Curriculum

Gpa = Annotated[float, Field(ge=0, le=4, allow_inf_nan=False)] | None


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ProfileEdit(Input):
    revision: int = Field(ge=1)
    alias: str = Field(min_length=1, max_length=80)
    current_term: int = Field(ge=1, le=MAX_TERM)
    completed: list[str] = Field(max_length=100)
    last_gpa: Gpa = None


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
    course_code: str
    title: str = Field(min_length=1, max_length=250)
    due_date: date | None = None


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


class WorkspaceImport(Input):
    alias: str = Field(min_length=1, max_length=80)
    current_term: int = Field(ge=1, le=MAX_TERM)
    last_gpa: Gpa = None
    curriculum: Curriculum
