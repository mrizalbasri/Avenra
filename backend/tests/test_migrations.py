"""Migrations run forward and back on SQLite, the database the desktop app uses."""

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

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
