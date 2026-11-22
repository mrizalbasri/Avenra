from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=new_id)
    alias: Mapped[str] = mapped_column(String(80))
    current_term: Mapped[int] = mapped_column(Integer, default=2)
    completed: Mapped[list] = mapped_column(JSON, default=list)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    curriculum: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_gpa: Mapped[float | None] = mapped_column(Float, nullable=True)


class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    assignments: Mapped[dict] = mapped_column(JSON, default=dict)
    layout: Mapped[dict] = mapped_column(JSON, default=dict)
    failed: Mapped[list] = mapped_column(JSON, default=list)
    credit_cap: Mapped[int] = mapped_column(Integer, default=12)
    horizon: Mapped[int] = mapped_column(Integer, default=8)
    expected_gpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class StudyTask(Base):
    __tablename__ = "study_tasks"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    course_code: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(String(250))
    due_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    course_code: Mapped[str] = mapped_column(String(20))
    seconds: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
