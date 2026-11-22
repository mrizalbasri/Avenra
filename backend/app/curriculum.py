import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

MAX_TERM = 14


class Course(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=150)
    credits: int = Field(gt=0, le=24)
    recommended_term: int = Field(gt=0, le=MAX_TERM)
    category: Literal["required", "elective"] = "required"
    # Every listed course must be finished in an earlier term.
    prerequisites: list[str] = Field(max_length=100)
    # Each group needs at least one finished course, for "A or B" rules.
    any_prerequisites: list[list[str]] = Field(default_factory=list, max_length=20)
    # A corequisite is finished earlier or taken in the same term.
    corequisites: list[str] = Field(default_factory=list, max_length=20)
    # Credits that must be earned before the term this course is taken in.
    min_credits_earned: int = Field(default=0, ge=0, le=300)
    offered_terms: list[int] = Field(default_factory=lambda: [0, 1])


class GpaCreditRule(BaseModel):
    """Students whose last-term GPA (IPS) is at least min_gpa may take max_credits."""

    min_gpa: float = Field(ge=0, le=4)
    max_credits: int = Field(ge=1, le=24)


class Curriculum(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=150)
    version: str = Field(min_length=1, max_length=80)
    status: str = Field(max_length=30)
    disclaimer: str = Field(max_length=1000)
    credit_cap: int = Field(ge=1, le=24)
    courses: list[Course] = Field(min_length=1, max_length=100)
    source: str = Field(default="Synthetic demonstration fixture", max_length=500)
    # None means every listed course is needed to graduate.
    graduation_credits: int | None = Field(default=None, ge=1, le=300)
    max_terms: int = Field(default=MAX_TERM, ge=1, le=MAX_TERM)
    # The semester the program is meant to finish in; "on time" is measured against it.
    target_terms: int = Field(default=8, ge=1, le=MAX_TERM)
    gpa_credit_rules: list[GpaCreditRule] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def check_graph(self):
        codes = {course.code for course in self.courses}
        if len(codes) != len(self.courses):
            raise ValueError("Course codes must be unique")
        for course in self.courses:
            references = set(course.prerequisites) | set(course.corequisites)
            references |= {code for group in course.any_prerequisites for code in group}
            if not references <= codes:
                raise ValueError(f"{course.code} refers to an unknown course")
            if course.code in references:
                raise ValueError(f"{course.code} cannot require itself")
            if any(len(group) < 2 for group in course.any_prerequisites):
                raise ValueError(f"{course.code}: an 'any of' group needs at least two courses")
            if not course.offered_terms or not set(course.offered_terms) <= {0, 1}:
                raise ValueError("Offering parity must be odd or even")
        # Strict ordering edges; corequisites may share a term, so they are excluded.
        resolved = set()
        while len(resolved) < len(codes):
            ready = {
                c.code
                for c in self.courses
                if set(c.prerequisites) <= resolved
                and all(set(group) & resolved for group in c.any_prerequisites)
            }
            if ready <= resolved:
                raise ValueError("Prerequisite graph contains a cycle")
            resolved |= ready
        if self.graduation_credits is not None:
            required = sum(c.credits for c in self.courses if c.category == "required")
            available = sum(c.credits for c in self.courses)
            if available < self.graduation_credits:
                raise ValueError("The courses listed cannot reach the graduation credits")
            if required > self.graduation_credits:
                raise ValueError("Required courses exceed the graduation credits")
        if any(c.recommended_term > self.max_terms for c in self.courses):
            raise ValueError("A recommended semester is beyond the maximum study period")
        if self.target_terms > self.max_terms:
            raise ValueError("The target semester is beyond the maximum study period")
        return self

    def gpa_cap(self, gpa: float | None) -> int | None:
        if gpa is None or not self.gpa_credit_rules:
            return None
        eligible = [r.max_credits for r in self.gpa_credit_rules if gpa >= r.min_gpa]
        return max(eligible) if eligible else min(r.max_credits for r in self.gpa_credit_rules)


def load_demo_curriculum(legacy: bool = False) -> Curriculum:
    """The bundled synthetic curriculum.

    Demo workspaces created before the curriculum snapshot was stored keep the
    original 12-course fixture, so their saved plans stay meaningful.
    """
    name = "demo-curriculum-legacy.json" if legacy else "demo-curriculum.json"
    path = Path(__file__).resolve().parent / "fixtures" / name
    return Curriculum.model_validate(json.loads(path.read_text(encoding="utf-8")))
