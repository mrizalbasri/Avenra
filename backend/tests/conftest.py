import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import WORKSPACE_ID_RE, get_session
from app.main import app
from app.models import Base


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)

    def session(request: Request):
        workspace_id = request.headers.get("X-Workspace-ID", "local-demo")
        if not WORKSPACE_ID_RE.fullmatch(workspace_id):
            raise HTTPException(
                400,
                {
                    "code": "INVALID_WORKSPACE_ID",
                    "message": "Invalid workspace identifier.",
                    "params": {},
                },
            )
        with Session(engine) as db:
            db.info["workspace_id"] = workspace_id
            yield db

    app.dependency_overrides[get_session] = session
    try:
        with TestClient(app) as client:
            client.engine = engine
            yield client
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


@pytest.fixture
def workspace(client):
    response = client.post("/api/v1/workspace/bootstrap")
    assert response.status_code == 200
    return response.json()


def editable(plan, profile_revision=1):
    return {
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
    } | {"profile_revision": profile_revision}
