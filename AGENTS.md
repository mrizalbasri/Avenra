# Repository Guidelines

## Project Structure & Module Organization

Avenra is a local academic planning and learning MVP with synthetic and user-supplied curricula.

- `BRD_Avenra_STACK_2026.md`: business requirements and research hypotheses.
- `PRD_Avenra_STACK_2026.md`: product scope, API draft, and acceptance scenarios.
- `docs/IMPLEMENTATION_PLAN.md`: authorized setup scope and subsequent product milestones.

`apps/web/src/routes` contains Overview, curriculum import, profiles, plans, comparison, study, and passport pages. `src/lib/components` holds canvas nodes and shared UI. Browser tests live in `apps/web/tests`. `apps/api/app` separates persistence, request schemas, rule checking, solver, and routes. Backend tests and Alembic revisions live under `apps/api/tests` and `migrations`. `data/fixtures` holds the synthetic curriculum.

## Build, Test, and Development Commands

Use Node 24, pnpm 11.18.0, Python 3.12, and uv. From the root:

- `pnpm dev`, `pnpm check`, `pnpm build`: web development, type checks, production build.
- `uv --directory apps/api run uvicorn app.main:app --reload --host 127.0.0.1 --port 18080`: API development.
- Reuse `postgres-local:5434` with database `avenra`; `docker start postgres-local` starts the shared instance if stopped.
- `uv --directory apps/api run pytest`: backend suite.
- `pnpm test:e2e`: Playwright suite with automatic server startup.

See README for environment setup, dependency installation, migrations, and shutdown.

## Coding Style & Naming Conventions

Use two-space indentation in TypeScript/Svelte and four spaces in Python. Use PascalCase components and snake_case Python modules/functions. Keep academic assignments separate from canvas coordinates. Preserve the monochrome dark theme and use `|` instead of long dashes in UI text. Use `pnpm format:check` and Ruff for formatting/linting.

## Testing Guidelines

Use pytest (`test_*.py`) and Playwright (`*.spec.ts`). Cover rule violations, solver output rechecking, infeasible/timeout outcomes, revision conflicts, workspace scoping, draft recovery, and timers. Unit tests use isolated in-memory databases; local browser tests create fictional workspaces in Avenra's database. No numeric coverage threshold is established. Report actual results and blockers.

## Commit & Pull Request Guidelines

Use English Conventional Commits, for example `feat(api): validate curriculum prerequisites`, and semantic branches such as `feat/curriculum-validation`. Keep commits atomic. PRs should explain behavior, reference requirements/issues, report verification, and include screenshots for UI changes.

Preserve unrelated changes. Create commits only when requested; obtain authorization before pushing, merging, or changing remotes. Prefer authenticated `gh` for GitHub operations and SSH for Git transport.

## Data Safety & Agent Instructions

Keep credentials outside version control. Label synthetic and user-supplied rules and source references. Browser workspace IDs provide scoping, not authentication; this local prototype must not be presented as a secure public student-record service. Preserve other projects' databases in shared PostgreSQL.

If `.codegraph/` exists, prioritize CodeGraph for architectural exploration and verify source before editing. Otherwise use standard search; never generate an index without authorization.
