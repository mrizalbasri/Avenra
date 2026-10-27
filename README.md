# Avenra

An explainable academic planning and recovery workspace, created for STACK 2026,
Case 1: Smarter Campus and Learning.

**Current status: development foundation.** The application loads a synthetic
curriculum from FastAPI, displays its prerequisite graph in Svelte Flow, and
saves visual card positions in browser storage. Live API/database status is
visible. Academic plan persistence, semester reassignment, rule validation,
recovery generation, comparison, passport export, and study tools are planned.
Installing OR-Tools does not mean the recovery engine is implemented.

## Stack

SvelteKit 3 / Svelte 5, TypeScript, Svelte Flow, Tailwind CSS, FastAPI,
PostgreSQL 17, SQLAlchemy/Alembic, and OR-Tools CP-SAT.
Node adapter is configured for a standalone web server.

## Requirements

- Node.js 24 LTS and pnpm 11.18.0.
- Python 3.12 and uv (Python 3.14 is not the supported API environment).
- Docker Desktop with its Linux engine running.
- Free local ports: 5173 (web), 18080 (API), 55432 (PostgreSQL).

## Local setup

Run these PowerShell commands from the repository root. Copy environment
examples only on first setup; retain your existing local configuration thereafter.
The example database password is a public local-development placeholder, not a
production secret. Set matching values in both local environment files if changed.

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install --frozen-lockfile
uv --directory apps/api sync --frozen
docker compose up -d --wait db
uv --directory apps/api run alembic upgrade head
```

In one terminal:

```powershell
uv --directory apps/api run uvicorn app.main:app --reload --host 127.0.0.1 --port 18080
```

In another:

```powershell
pnpm dev
```

Open http://127.0.0.1:5173 and API documentation at
http://127.0.0.1:18080/docs. No account is needed for the synthetic local demo.
Drag cards, save their layout, then reload. Moving a card does not yet change
its semester or run academic validation. Save layout stores positions only in
this browser; Reset layout restores the default arrangement until saved again.

## Verification

```powershell
pnpm check
pnpm build
pnpm format:check
uv --directory apps/api run ruff check .
uv --directory apps/api run ruff format --check .
uv --directory apps/api run pytest
pnpm --filter @avenra/web exec playwright install chromium
pnpm test:e2e
```

Playwright starts the API and web server automatically (ports 18080 and 4173).
It checks API integration, canvas movement/save/reload, and mobile overflow.
The backend suite checks sanitized readiness failures, fixture references, and
a tiny CP-SAT problem. These are foundation checks, not academic engine validation.

The `/health/live` endpoint checks the process; `/health/ready` returns HTTP 503
when PostgreSQL is unavailable. `GET /api/v1/curricula/demo` reads versioned
synthetic fixtures and does not require the database.

## Structure

```text
apps/web/          SvelteKit workspace and Playwright tests
apps/api/app/      FastAPI configuration, database access, curriculum endpoint
apps/api/tests/    API and solver runtime tests
apps/api/migrations/  Alembic migration foundation; no domain tables yet
data/fixtures/     Synthetic curriculum and explicit provenance
docs/              Designs, implementation plan, verification evidence
.github/           CI and contribution templates
```

## Production build and shutdown

```powershell
pnpm build
# Run from apps/web; set ORIGIN to your actual deployment origin.
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:ORIGIN = 'http://127.0.0.1:3000'
node --env-file=.env build
```

Stop development servers with Ctrl+C. `docker compose stop db` stops PostgreSQL;
its named volume retains data. Configure real secrets, authenticated access,
ownership checks, TLS, and deployment-specific settings before collecting personal
records or exposing a deployment. No public deployment has been configured.

## Data and limitations

All bundled courses/rules are fictional demonstration assumptions, not verified
university policies. Canvas placement is illustrative. No official graduation
decision or learning improvement is claimed. Never commit `.env` files, student
records, tokens, or private keys. No external AI provider or paid service is required.

The source is maintained for this project; no open-source license has been selected.

## Attribution and material AI assistance

Built on [SvelteKit](https://svelte.dev/docs/kit),
[Svelte Flow](https://svelteflow.dev), [Tailwind CSS](https://tailwindcss.com),
[FastAPI](https://fastapi.tiangolo.com), [PostgreSQL](https://www.postgresql.org),
[SQLAlchemy](https://www.sqlalchemy.org), [Alembic](https://alembic.sqlalchemy.org),
and [OR-Tools](https://developers.google.com/optimization).
Retain the Svelte Flow attribution. Dependency licenses remain with their authors.

OpenAI Codex materially assisted with planning, scaffolding, code, tests, and
documentation. Team members must review, understand, validate, and accurately
attribute the work under the competition rules. Original BRD/PRD documents are
retained; their proposed functionality is not evidence of implementation.
