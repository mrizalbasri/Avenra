from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.main import app

client = TestClient(app)


def test_liveness_does_not_require_database():
    assert client.get("/health/live").json()["status"] == "ok"


def test_readiness_reports_database_connected(monkeypatch):
    monkeypatch.setattr("app.main.check_database", lambda: None)
    assert client.get("/health/ready").json()["database"] == "connected"


def test_readiness_failure_is_sanitized(monkeypatch):
    def fail():
        raise OperationalError("SELECT 1", {}, Exception("private-connection-details"))

    monkeypatch.setattr("app.main.check_database", fail)
    response = client.get("/health/ready")
    assert response.status_code == 503
    assert "private-connection-details" not in response.text


def test_fixture_has_explicit_provenance_and_valid_references():
    response = client.get("/api/v1/curricula/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "synthetic"
    codes = {course["code"] for course in data["courses"]}
    assert len(codes) == len(data["courses"])
    for course in data["courses"]:
        assert set(course["prerequisites"]) <= codes
