# Repository Guidelines

## Project Structure & Module Organization

Avenra is an academic decision and recovery support project with a runnable development foundation.

- `BRD_Avenra_STACK_2026.md`: business requirements and research hypotheses.
- `PRD_Avenra_STACK_2026.md`: product scope, API draft, and acceptance scenarios.
- `docs/IMPLEMENTATION_PLAN.md`: authorized setup scope and subsequent product milestones.

`apps/web` contains SvelteKit, Svelte Flow, assets under `src/lib/assets`, and browser tests in `tests`. `apps/api/app` contains FastAPI modules; `apps/api/tests` holds backend tests and `migrations` holds Alembic revisions. `data/fixtures` contains synthetic curricula. Read relevant requirements before adding product features; most remain planned.

## Build, Test, and Development Commands

Use Node 24, pnpm 11.18.0, Python 3.12, and uv. From the root:

- `pnpm dev`, `pnpm check`, `pnpm build`: web development, type checks, production build.
- `uv --directory apps/api run uvicorn app.main:app --reload --host 127.0.0.1 --port 18080`: API development.
- Reuse `postgres-local:5434` with database `avenra`; `docker start postgres-local` starts the shared instance if stopped.
- `uv --directory apps/api run pytest`: backend suite.
- `pnpm test:e2e`: Playwright suite with automatic server startup.

See README for environment setup, dependency installation, migrations, and shutdown.

## Coding Style & Naming Conventions

Use two-space indentation in TypeScript/Svelte and four spaces in Python. Use PascalCase components and snake_case Python modules/functions. Keep academic assignments separate from canvas coordinates. Use `pnpm format:check` for Prettier and `uv --directory apps/api run ruff check .` for Python linting. Format Python with Ruff.

## Testing Guidelines

Use pytest (`test_*.py`) and Playwright (`*.spec.ts`). Add meaningful tests alongside features using the PRD test matrix, including prerequisite violations and infeasible plans. Independently validate solver outputs. No numeric coverage threshold is established. Report actual results and blockers; CI runs foundation checks.

## Commit & Pull Request Guidelines

Use English Conventional Commits, for example `feat(api): validate curriculum prerequisites`, and semantic branches such as `feat/curriculum-validation`. Keep commits atomic. PRs should explain behavior, reference requirements/issues, report verification, and include screenshots for UI changes.

Preserve unrelated changes. Create commits only when requested; obtain authorization before pushing, merging, or changing remotes. Prefer authenticated `gh` for GitHub operations and SSH for Git transport.

## Data Safety & Agent Instructions

Use synthetic records by default; label assumptions and curriculum provenance. Keep credentials outside version control. Distinguish proposed capabilities from verified functionality.

If `.codegraph/` exists, prioritize CodeGraph for architectural exploration and verify source before editing. Otherwise use standard search; never generate an index without authorization.
