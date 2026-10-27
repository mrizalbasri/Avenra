# Avenra

An explainable academic planning and recovery workspace, created for STACK 2026,
Case 1: Smarter Campus and Learning.

**Current status: functional local MVP.** Import a program-specific curriculum,
maintain academic progress, create independent plans, move courses between semesters
on a canvas or board, validate rules, generate recovery alternatives, compare plans,
track learning targets, use a focus/break timer, and print a Decision Passport.
Plans, layouts, tasks, and finished sessions persist in PostgreSQL. A synthetic
curriculum remains available for demonstrations.

Curricula are not restricted to one university. Imported rules remain
**user-supplied**, not institutionally verified. This local prototype has no sign-in:
browser workspace identifiers provide scoping, not authentication. Use aliases and
non-sensitive examples. Public deployment is not production-ready.

## Stack

SvelteKit 3 / Svelte 5, TypeScript, Svelte Flow, Tailwind CSS, FastAPI,
PostgreSQL 18, SQLAlchemy/Alembic, and OR-Tools CP-SAT.
Node adapter is configured for a standalone web server.

## Requirements

- Node.js 24 LTS and pnpm 11.18.0.
- Python 3.12 and uv (Python 3.14 is not the supported API environment).
- An existing PostgreSQL instance; this workspace reuses Docker container
  `postgres-local` on port 5434 with a dedicated `avenra` database.
- Free local ports: 5173 (web), 18080 (API).

## Local setup

Run these PowerShell commands from the repository root. Copy environment
examples only on first setup; retain your existing local configuration thereafter.
Set `DATABASE_URL` in `apps/api/.env` using your existing PostgreSQL credentials.
The checked-in example contains placeholders only. The local workspace is already
configured; do not overwrite its `.env` when restarting development.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install --frozen-lockfile
uv --directory apps/api sync --frozen
uv --directory apps/api run alembic upgrade head
```

Before migrations on a fresh machine, create database `avenra` in your existing
instance using an authorized PostgreSQL role. For the shared local container,
start it with `docker start postgres-local` if needed. Do not start a second
PostgreSQL server or modify other projects' databases. The shared administrator
can create the database using `createdb -h 127.0.0.1 -p 5434 -U YOUR_USER avenra`.

In one terminal:

```powershell
uv --directory apps/api run uvicorn app.main:app --reload --host 127.0.0.1 --port 18080
```

In another:

```powershell
pnpm dev
```

Open http://127.0.0.1:5173 and API documentation at
http://127.0.0.1:18080/docs. Choose **Open demo workspace** or **bring your own
curriculum**. No account is needed for local evaluation.

## Product walkthrough

1. Import CSV at `/curriculum`, recording university, program, version, rule
   source, current semester, and credit cap. Download the included template.
   Each import creates a new workspace. Switch between remembered workspaces
   using the header selector; previous curricula and plans remain intact.
2. In **Academic profile**, mark completed courses. In **Study plans**, create
   or duplicate a plan. Rename, archive, and restore it in its settings.
3. Drag cards across semester frames or use board/select controls. Same-semester
   movement changes only visual coordinates. Undo/redo edits, then **Save & validate**.
   Invalid exploratory drafts remain clearly labeled.
4. Select failed/postponed courses under **Simulate a setback**. Save, then generate
   alternatives for earlier completion and lighter peak workload. Each result is
   independently checked. Save alternatives as separate plans.
5. Compare saved plans at `/compare`. Open **Passport** from a saved plan and
   **Print / Save as PDF** for a fresh advisor consultation snapshot.
6. In **Study & focus**, add course targets, mark tasks complete, and record focus
   sessions with reflections. Reload restores the timer paused using timestamps.
   Study completion never changes academic course completion.

CSV supports 1�100 required courses, prerequisite codes separated with semicolons,
credits, recommended semesters 1�12, and odd/even/both offerings. Duplicate codes,
missing references, and cycles are rejected. Elective groups, concurrent prerequisites,
GPA-dependent caps, credit transfer, and internship conversion require additional
modeling and advisor review. All imported courses are treated as required.
Automatic institutional data import is not implemented.

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
Browser checks cover plan movement/undo/save/reload, recovery, comparison, fresh
passports, curriculum import, workspace scoping, learning targets, timer recovery,
and mobile overflow. Backend tests cover rule violations, independent solver-output
checks, infeasible/timeout outcomes, revision conflicts, invalid curriculum graphs,
task persistence, and idempotent focus-session saves. Unit tests use isolated
in-memory databases. Local browser tests create fictional workspaces in Avenra's
database; CI uses disposable PostgreSQL.

The `/health/live` endpoint checks the process; `/health/ready` returns HTTP 503
when PostgreSQL is unavailable. `GET /api/v1/curricula/demo` reads versioned
synthetic fixtures and does not require the database.

## Structure

```text
apps/web/          SvelteKit workspace and Playwright tests
apps/api/app/      FastAPI configuration, database access, curriculum endpoint
apps/api/tests/    API and solver runtime tests
apps/api/migrations/  Alembic schema for profiles, curricula, plans, tasks, sessions
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

Stop development servers with Ctrl+C. Leave the shared PostgreSQL instance running
for other projects. Configure real secrets, authenticated access,
ownership checks, TLS, and deployment-specific settings before collecting personal
records or exposing a deployment. No public deployment has been configured.

## Data and limitations

Bundled courses/rules are fictional demonstration assumptions. Imported curricula
are user-supplied and require independent policy verification. No official graduation
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
