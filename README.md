# Avenra

An explainable academic planning and recovery workspace, created for STACK 2026,
Case 1: Smarter Campus and Learning.

**Current status: student-ready local workspace.** Paste a curriculum table from
Excel, Google Sheets, or a PDF in `/start`, edit courses/prerequisites/IPS rules
anytime in Profile, track passed courses, set a weekly time budget and up to 3
goals (internship, work, organisation, graduation, other), create independent plans,
move courses between semesters on a canvas or board, validate rules, generate
recovery alternatives, compare plans, track course or goal tasks with `.ics`
calendar reminders, use a focus/break timer, switch between Indonesian and English,
and print a Decision Passport. Data persists in PostgreSQL or in local SQLite mode
(`AVENRA_LOCAL=1`). An example curriculum remains available to try first.

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
Set `DATABASE_URL` in `backend/.env` using your existing PostgreSQL credentials.
The checked-in example contains placeholders only. The local workspace is already
configured; do not overwrite its `.env` when restarting development.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
pnpm install --frozen-lockfile
uv --directory backend sync --frozen
uv --directory backend run alembic upgrade head
```

Before migrations on a fresh machine, create database `avenra` in your existing
instance using an authorized PostgreSQL role. For the shared local container,
start it with `docker start postgres-local` if needed. Do not start a second
PostgreSQL server or modify other projects' databases. The shared administrator
can create the database using `createdb -h 127.0.0.1 -p 5434 -U YOUR_USER avenra`.

In one terminal:

```powershell
pnpm dev:backend
```

In another:

```powershell
pnpm dev:frontend
```

Open http://127.0.0.1:5173 and API documentation at
http://127.0.0.1:18080/docs. Choose **Open demo workspace** or **bring your own
curriculum**. No account is needed for local evaluation.

Frontend and backend run as separate services in this one repository. The browser
and SvelteKit SSR call FastAPI directly at `/api/v1`; there is no frontend API
proxy. Set `PUBLIC_API_BASE_URL` in `frontend/.env` to the backend origin and
`CORS_ORIGINS` in `backend/.env` to a JSON array of allowed frontend origins.
For example, a frontend on port 3000 requires
`CORS_ORIGINS=["http://127.0.0.1:3000"]`. Both the browser and SSR server must be
able to reach the configured API URL.

Each service has its own dependencies and setup guide: [frontend](frontend/README.md)
and [backend](backend/README.md). Building the frontend requires no Python or
database; running backend unit tests requires no Node or frontend source.
Existing users should move their ignored `apps/web/.env` to `frontend/.env`
and `apps/api/.env` to `backend/.env`, rename frontend `API_BASE_URL` to
`PUBLIC_API_BASE_URL`, and reinstall dependencies rather than moving generated
`node_modules`, `.svelte-kit`, or `.venv` directories.

## Product walkthrough

1. Set up a workspace at /start (4 steps): enter your name/alias, current semester,
   last IPS, language (EN/ID), and optional mission; paste a course table from
   Excel, Google Sheets, or a PDF (or start from the example curriculum) and fix any
   row issues inline; tick passed courses (with a shortcut for semesters 1 to N); and
   optionally enter your weekly time budget (default 170 min/SKS, editable) plus up
   to 3 goals such as an internship or organisation. Each workspace stays separate.
2. In **Academic profile**, update passed courses, mission, weekly time budget, and
   goals, or open **Edit courses** (PATCH /api/v1/curriculum) to add missing
   prerequisites and IPS rules later.
3. On **Overview**, check the graduation outlook, active goals for this semester,
   neutral notices when a semester's weekly hours exceed what is available, due
   course/goal tasks, and critical courses.
4. Drag cards across semester frames or use board/select controls, lock individual
   courses to a semester during recovery, and see live draft rule checks before saving.
   Each semester shows credit caps and weekly course + goal hours against available hours.
   Undo/redo edits, then **Save & validate**.
5. Select failed/postponed courses under **Simulate a setback**. Save, then generate
   alternatives for earlier completion and lighter peak workload while respecting locked
   courses. When infeasible, Avenra explains blocking chains, credit shortfalls, locked
   courses, or weekly time budget limits and tests the smallest horizon extension,
   budget-bounded credit cap increase, goal-hour reduction, or unlock that fits.
6. Manage plans (including setting your primary Overview plan and deleting spare plans)
   and compare saved plans at /compare, with **Copy comparison summary** and
   **Print / Save as PDF** plus optional advisor notes. Open **Passport** from a saved
   plan for a fresh advisor consultation snapshot with optional personal notes and all
   active assumptions (including the weekly minutes-per-SKS assumption).
7. In **Study & focus**, add manual targets or paste a class announcement (WhatsApp,
   Telegram, or LMS) to review and confirm extracted details, a planned start date,
   and a 10-minute first step before saving. Launch any course or goal task straight into
   the focus/break timer (saved to PostgreSQL/SQLite), filter by status or goal, and
   export open targets to `.ics` with both 09:00 planned-start reminders and 19:00
   day-before due-date reminders. Reload restores the timer paused using timestamps.
   Study completion never changes academic course completion. Shareable curriculum
   templates (`.json`, without personal data) can also be exported in Profile and uploaded
   in `/start`.

Table import supports 1-100 courses (required or elective), auto-detected delimiters
(tab, comma, semicolon, or aligned spaces), English and Indonesian column aliases,
all-of (;) and any-of (A|B) prerequisites, corequisites, earned-credit
thresholds, semesters 1-14, odd/even/both offerings, and optional IPS credit tables.
Duplicate codes, missing references, and cycles are rejected. Exceptions, credit
transfer, and internship conversion still require advisor review. Automatic
institutional data import is not implemented.

## Verification

```powershell
pnpm check
pnpm test:unit
pnpm build
pnpm format:check
uv --directory backend run ruff check .
uv --directory backend run ruff format --check .
uv --directory backend run pytest
pnpm --filter @avenra/web exec playwright install chromium
pnpm test:e2e
```

Playwright starts the API and builds/starts the production frontend automatically
(ports 18080 and 4173), avoiding development-only HMR and dependency-optimizer races.
If those ports are occupied, set `E2E_API_PORT` and `E2E_WEB_PORT` to free ports;
the test servers, API URL, and allowed browser origin follow those values.
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
frontend/              SvelteKit UI, HTTP client, and Playwright tests
backend/app/           FastAPI, persistence, academic rules, and solver
backend/app/fixtures/  Bundled synthetic curriculum and explicit provenance
backend/tests/         API and solver runtime tests
backend/migrations/    Alembic database schema
docs/                  Designs, implementation plan, verification evidence
.github/               CI and contribution templates
```

## Production build and shutdown

```powershell
# Set ORIGIN before building; SvelteKit 3 embeds paths.origin in the server.
$env:ORIGIN = 'http://127.0.0.1:3000'
pnpm build
# Run the remaining commands from frontend.
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
node --env-file=.env build
```

Rebuild when the frontend origin changes. Without an explicit origin, adapter-node
infers HTTPS, which is incorrect for a direct local HTTP production server.

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
