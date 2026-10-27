# Avenra backend

FastAPI API with SQLAlchemy/Alembic and OR-Tools. Requires Python 3.12 and uv;
PostgreSQL is required for persisted workspaces. Node and the frontend source are
not needed to run or test this service.

From this directory:

```powershell
# First setup only; retain an existing .env.
Copy-Item .env.example .env
uv sync --frozen
# Configure DATABASE_URL before running migrations.
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 18080
```

Reuse the dedicated `avenra` database in the shared `postgres-local` instance on
port 5434. Keep credentials in `.env`, never in tracked files. Do not modify other
projects' databases.

## API boundary

- API documentation: `http://127.0.0.1:18080/docs`.
- Liveness: `/health/live`; database readiness: `/health/ready`.
- Product endpoints: `/api/v1`; workspace scoping: `X-Workspace-ID`.
- `CORS_ORIGINS` is a JSON array of exact frontend origins. Configure it when
  using a different frontend host or port. CORS is not access control.
- `app/fixtures/demo-curriculum.json` is bundled synthetic data, independent of
  frontend files or the repository working directory.

Run `uv run pytest`, `uv run ruff check .`, and `uv run ruff format --check .`
here. Unit tests use in-memory SQLite and need neither frontend nor PostgreSQL.

Deploy this directory independently with its lockfile, migrations, and fixtures.
Provide environment variables on the host and run Uvicorn without `--reload`.
This remains a local, unauthenticated prototype; independent deployment does not
make it safe for public student records.
