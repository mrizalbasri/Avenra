# Avenra local development setup

Status: historical setup proposal. SvelteKit/FastAPI foundation setup was authorized
and implemented on 27 October 2026. See `../../IMPLEMENTATION_PLAN.md` and the root
README for current scope and commands. The initial-state descriptions below are
retained as design context.

## Context and scope

The workspace currently contains the BRD and PRD. There is no Git repository,
application code, or CodeGraph index. The supplied proposal specifies SvelteKit,
TypeScript, Tailwind CSS, FastAPI, PostgreSQL, and OR-Tools CP-SAT. The PRD also
allows Next.js and fixture-based storage, so those choices remain proposals.

This setup establishes a runnable development foundation. Academic planning,
authentication, production deployment, and institutional integrations are separate
implementation work. Existing BRD and PRD files remain in place.

## Approaches

1. Recommended: SvelteKit frontend, FastAPI backend, and local PostgreSQL through
   Docker Compose. Closest to the supplied proposal; requires Docker for storage.
2. Lightweight: the same frontend and backend with JSON fixtures initially.
   Fewer services to run, but persistence and migrations must be added later.
3. React alternative: Next.js frontend with FastAPI and PostgreSQL. Appropriate
   if the team prefers React, but departs from the proposal's frontend choice.

## Proposed foundation

- `apps/web`: SvelteKit, TypeScript, and Tailwind CSS; pnpm dependency lockfile.
- `apps/api`: FastAPI with Python dependencies managed by uv and a lockfile.
- `apps/api/tests`: pytest smoke tests and isolated test configuration.
- `data/fixtures`: explicitly synthetic, versioned curriculum sample data.
- `docs`: setup design, architecture notes, and source/provenance guidance.
- Root Docker Compose configuration: PostgreSQL with a health check and named
  data volume. Frontend and API run natively during normal development.
- Root README, environment examples, ignore rules, and development commands
  suitable for Windows PowerShell.

Choose supported runtime and dependency versions during implementation after
checking current official documentation and local compatibility. The installed
Python 3.14 must not be assumed compatible with OR-Tools; use an isolated,
compatible interpreter rather than changing the system Python.

## Integration and behavior

The browser opens the frontend. The frontend checks the backend through a
same-origin server route, keeping database credentials on the server. The API
exposes liveness and readiness endpoints. Liveness checks the API process;
readiness reports unavailable when the configured database cannot be reached.
Failures produce a readable status and an appropriate HTTP status code without
exposing credentials or internal exception details.

Add a minimal non-personal database connectivity check and migration foundation.
Do not finalize student-record tables before the domain model is implemented.
Keep graph analysis, solver logic, and explanation generation behind separate
backend modules as those features are added. Installing OR-Tools and verifying
it with a tiny constraint problem establishes compatibility; it does not mean
the academic recovery engine is complete.

Synthetic fixtures must state that their rules are demonstration assumptions,
not verified university policies. The initial page is a development connectivity
screen, not the final product interface.

## Verification

From a fresh dependency installation, verify frontend type checking and build,
backend health behavior, database readiness, and an OR-Tools smoke problem.
Check readiness both with the database available and unavailable. Document
actual results and any blocked checks. Ensure environment files containing
credentials and generated dependencies are ignored.

## Git boundary

Local Git initialization may be included in the approved foundation. Do not
create commits, configure remotes, push, or create a GitHub repository without
the user's authorization. No paid services or external credentials are required
for this local setup.

## Completion criteria

The README provides reproducible installation, startup, verification, and
shutdown commands. The frontend can display API and database connectivity.
Dependency versions are locked, example configuration is supplied, and the
verification commands have been run with results reported. Product features
remain explicitly identified as subsequent work.
