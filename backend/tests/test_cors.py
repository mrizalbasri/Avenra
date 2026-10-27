from app.config import Settings, get_settings
from app.curriculum import load_demo_curriculum


def test_preflight_allows_configured_frontend_and_workspace_header(client):
    origin = get_settings().cors_origins[0]
    response = client.options(
        "/api/v1/workspace/bootstrap",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-workspace-id",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "x-workspace-id" in response.headers["access-control-allow-headers"].lower()
    assert "access-control-allow-credentials" not in response.headers


def test_preflight_rejects_unconfigured_origin(client):
    response = client.options(
        "/api/v1/workspace/bootstrap",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-workspace-id",
        },
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_browser_reads_and_validation_errors_include_cors_headers(client):
    origin = get_settings().cors_origins[0]
    headers = {"Origin": origin, "X-Workspace-ID": "separate-frontend"}
    response = client.get("/api/v1/workspace", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    response = client.patch("/api/v1/profile", headers=headers, json={})
    assert response.status_code == 422
    assert response.headers["access-control-allow-origin"] == origin


def test_origins_can_be_configured_from_environment(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", '["https://frontend.example"]')
    assert Settings(_env_file=None).cors_origins == ["https://frontend.example"]


def test_bundled_fixture_does_not_depend_on_working_directory(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    assert load_demo_curriculum().status == "synthetic"
