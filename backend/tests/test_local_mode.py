from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import database
from app.config import get_settings


@pytest.fixture
def local_app(tmp_path, monkeypatch):
    """The real API on a fresh SQLite file, started the way the desktop app starts it."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AVENRA_LOCAL", "1")
    monkeypatch.setenv("AVENRA_DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    database.get_engine.cache_clear()
    from app.main import app

    with TestClient(app) as client:
        yield client, tmp_path
    database.get_engine().dispose()
    get_settings.cache_clear()
    database.get_engine.cache_clear()


def test_local_mode_creates_and_migrates_its_own_database(local_app):
    client, folder = local_app
    assert (folder / "avenra.db").exists()
    assert client.get("/health/ready").json() == {"status": "ok", "database": "connected"}
    assert get_settings().effective_database_url.startswith("sqlite:///")


def test_full_recovery_flow_runs_on_sqlite(local_app):
    client, _ = local_app
    workspace = client.post("/api/v1/workspace/bootstrap").json()
    plan = workspace["plans"][0]
    assert not plan["validation"]["findings"]
    outlook = client.get(f"/api/v1/plans/{plan['id']}/outlook").json()
    assert outlook["status"] == "on_track"
    editable = {
        key: plan[key]
        for key in (
            "name",
            "assignments",
            "failed",
            "credit_cap",
            "horizon",
            "expected_gpa",
            "revision",
            "archived",
        )
    } | {"profile_revision": 1, "failed": ["IF2101"]}
    saved = client.patch(f"/api/v1/plans/{plan['id']}", json=editable).json()
    solved = client.post(
        f"/api/v1/plans/{plan['id']}/solve",
        json={"revision": saved["revision"], "profile_revision": 1},
    ).json()
    assert solved["status"] == "feasible"
    task = client.post(
        "/api/v1/study/tasks", json={"course_code": "IF2103", "title": "Review chapter 2"}
    )
    assert task.status_code == 201


def test_data_survives_a_restart(local_app, monkeypatch):
    client, folder = local_app
    client.post("/api/v1/workspace/bootstrap")
    client.post("/api/v1/study/tasks", json={"course_code": "IF2103", "title": "Keep me"})
    database.get_engine().dispose()
    database.get_engine.cache_clear()
    from app.main import app

    with TestClient(app) as again:
        assert again.get("/api/v1/study").json()["tasks"][0]["title"] == "Keep me"


def test_foreign_keys_are_enforced_in_sqlite(local_app):
    from sqlalchemy import text

    with database.get_engine().connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1


def test_default_data_dir_follows_each_system(monkeypatch, tmp_path):
    from app import config

    monkeypatch.setattr(config.sys, "platform", "darwin")
    monkeypatch.setattr(config.Path, "home", classmethod(lambda cls: tmp_path))
    assert (
        config.default_data_dir() == Path(tmp_path) / "Library" / "Application Support" / "Avenra"
    )
    monkeypatch.setattr(config.sys, "platform", "win32")
    monkeypatch.setenv("APPDATA", str(tmp_path / "roaming"))
    assert config.default_data_dir() == tmp_path / "roaming" / "Avenra"
