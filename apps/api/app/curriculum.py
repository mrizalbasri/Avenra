import json
from pathlib import Path

from pydantic import BaseModel, Field, model_validator


class Course(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=150)
    credits: int = Field(gt=0, le=24)
    recommended_term: int = Field(gt=0, le=12)
    prerequisites: list[str] = Field(max_length=100)
    offered_terms: list[int] = Field(default_factory=lambda: [0, 1])


class Curriculum(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=150)
    version: str = Field(min_length=1, max_length=80)
    status: str = Field(max_length=30)
    disclaimer: str = Field(max_length=1000)
    credit_cap: int = Field(ge=1, le=24)
    courses: list[Course] = Field(min_length=1, max_length=100)
    source: str = Field(default="Synthetic demonstration fixture", max_length=500)

    @model_validator(mode="after")
    def check_graph(self):
        codes = {course.code for course in self.courses}
        if len(codes) != len(self.courses):
            raise ValueError("Course codes must be unique")
        resolved = set()
        for course in self.courses:
            if not set(course.prerequisites) <= codes:
                raise ValueError("Unknown prerequisite")
            if not course.offered_terms or not set(course.offered_terms) <= {0, 1}:
                raise ValueError("Offering parity must be odd or even")
        while len(resolved) < len(codes):
            ready = {c.code for c in self.courses if set(c.prerequisites) <= resolved}
            if ready <= resolved:
                raise ValueError("Prerequisite graph contains a cycle")
            resolved |= ready
        return self


def load_demo_curriculum() -> Curriculum:
    path = Path(__file__).resolve().parents[3] / "data/fixtures/demo-curriculum.json"
    return Curriculum.model_validate(json.loads(path.read_text(encoding="utf-8")))
