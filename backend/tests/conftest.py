import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import get_session
from app.main import app
from app.models import Base


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)

    def session(request: Request):
        with Session(engine) as db:
            db.info["workspace_id"] = request.headers.get("X-Workspace-ID", "local-demo")
            yield db

    app.dependency_overrides[get_session] = session
    try:
        with TestClient(app) as client:
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
            "revision",
            "archived",
        )
    } | {"profile_revision": profile_revision}
