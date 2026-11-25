"""Migrations run forward and back on SQLite, the database the desktop app uses."""

from datetime import UTC, datetime

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, create_engine, inspect, select

from app import database
from app.config import get_settings


@pytest.fixture
def sqlite_db(tmp_path, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AVENRA_LOCAL", "1")
    monkeypatch.setenv("AVENRA_DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    database.get_engine.cache_clear()
    config = Config()
    config.set_main_option("script_location", str(database.MIGRATIONS))
    yield config, get_settings().effective_database_url
    get_settings.cache_clear()
    database.get_engine.cache_clear()


def columns(url, table):
    engine = create_engine(url)
    try:
        return {column["name"]: column for column in inspect(engine).get_columns(table)}
    finally:
        engine.dispose()


def test_0006_adds_goal_columns_and_downgrades_cleanly(sqlite_db):
    config, url = sqlite_db
    command.upgrade(config, "head")
    profile = columns(url, "profiles")
    assert {"mission", "time_budget", "goals"} <= set(profile)
    tasks = columns(url, "study_tasks")
    assert "goal_id" in tasks
    assert tasks["course_code"]["nullable"]

    command.downgrade(config, "0005")
    assert not {"mission", "time_budget", "goals"} & set(columns(url, "profiles"))
    tasks = columns(url, "study_tasks")
    assert "goal_id" not in tasks
    assert not tasks["course_code"]["nullable"]

    command.upgrade(config, "head")
    assert "goals" in columns(url, "profiles")
    tasks = columns(url, "study_tasks")
    assert {"start_date", "first_step", "details"} <= set(tasks)

    command.downgrade(config, "0006")
    tasks = columns(url, "study_tasks")
    assert not {"start_date", "first_step", "details"} & set(tasks)

    command.upgrade(config, "head")
    assert {"start_date", "first_step", "details"} <= set(columns(url, "study_tasks"))


def test_0008_adds_plan_pins_primary_and_goal_focus_sessions(sqlite_db):
    config, url = sqlite_db
    command.upgrade(config, "0007")
    engine = create_engine(url)
    try:
        meta = MetaData()
        meta.reflect(bind=engine)
        profiles_tbl = meta.tables["profiles"]
        plans_tbl = meta.tables["plans"]
        t0 = datetime(2026, 1, 1, 10, 0, tzinfo=UTC)
        t1 = datetime(2026, 1, 1, 11, 0, tzinfo=UTC)
        t2 = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
        with engine.begin() as conn:
            conn.execute(
                profiles_tbl.insert().values(
                    id="mig-ws",
                    alias="Migration Student",
                    current_term=3,
                    completed=[],
                    revision=1,
                    goals=[],
                )
            )
            conn.execute(
                plans_tbl.insert(),
                [
                    {
                        "id": "plan-archived-old",
                        "profile_id": "mig-ws",
                        "name": "Archived",
                        "assignments": {},
                        "layout": {},
                        "failed": [],
                        "credit_cap": 20,
                        "horizon": 8,
                        "revision": 1,
                        "archived": True,
                        "created_at": t0,
                    },
                    {
                        "id": "plan-active-1",
                        "profile_id": "mig-ws",
                        "name": "Primary",
                        "assignments": {},
                        "layout": {},
                        "failed": [],
                        "credit_cap": 20,
                        "horizon": 8,
                        "revision": 1,
                        "archived": False,
                        "created_at": t1,
                    },
                    {
                        "id": "plan-active-2",
                        "profile_id": "mig-ws",
                        "name": "Secondary",
                        "assignments": {},
                        "layout": {},
                        "failed": [],
                        "credit_cap": 20,
                        "horizon": 8,
                        "revision": 1,
                        "archived": False,
                        "created_at": t2,
                    },
                ],
            )
    finally:
        engine.dispose()

    command.upgrade(config, "head")
    plans = columns(url, "plans")
    assert {"pinned", "is_primary"} <= set(plans)
    sessions = columns(url, "focus_sessions")
    assert "goal_id" in sessions
    assert sessions["course_code"]["nullable"]

    engine = create_engine(url)
    try:
        meta = MetaData()
        meta.reflect(bind=engine)
        plans_tbl = meta.tables["plans"]
        with engine.connect() as conn:
            flags = dict(
                conn.execute(
                    select(plans_tbl.c.id, plans_tbl.c.is_primary).where(
                        plans_tbl.c.profile_id == "mig-ws"
                    )
                ).all()
            )
        assert flags == {
            "plan-archived-old": False,
            "plan-active-1": True,
            "plan-active-2": False,
        }
    finally:
        engine.dispose()

    command.downgrade(config, "0007")
    plans = columns(url, "plans")
    assert not {"pinned", "is_primary"} & set(plans)
    sessions = columns(url, "focus_sessions")
    assert "goal_id" not in sessions
    assert not sessions["course_code"]["nullable"]

    command.upgrade(config, "head")
    assert {"pinned", "is_primary"} <= set(columns(url, "plans"))
    assert "goal_id" in columns(url, "focus_sessions")
    assert columns(url, "focus_sessions")["course_code"]["nullable"]
