import json
from pathlib import Path

from pydantic import BaseModel, Field


class Course(BaseModel):
    code: str
    name: str
    credits: int = Field(gt=0)
    recommended_term: int = Field(gt=0)
    prerequisites: list[str]


class Curriculum(BaseModel):
    id: str
    name: str
    version: str
    status: str
    disclaimer: str
    credit_cap: int
    courses: list[Course]


def load_demo_curriculum() -> Curriculum:
    path = Path(__file__).resolve().parents[3] / "data/fixtures/demo-curriculum.json"
    return Curriculum.model_validate(json.loads(path.read_text(encoding="utf-8")))
