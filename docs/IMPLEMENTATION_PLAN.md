# Foundation implementation plan

The subsequent request expands this work to the end-to-end local MVP. See
`MVP_WORKSPACE.md` for current implemented scope, per-student curriculum import,
verification boundaries, and the release limitations. The milestone list below
is retained as the original foundation roadmap, not a current feature inventory.

The user authorized SvelteKit/FastAPI setup, local verification, and GitHub
repository creation on 27 October 2026. This supersedes the proposed Next.js
choice in the earlier MVP design. Product features remain a staged backlog.

The subsequent setup correction keeps pnpm and reuses the existing shared
`postgres-local` instance on port 5434. A dedicated `avenra` database replaces
the original isolated PostgreSQL container. Local credentials stay in the ignored
API `.env`; no new database server or credentials are provisioned. CI continues
to use an isolated disposable PostgreSQL service on port 55432.

## Foundation scope

1. Preserve the supplied BRD/PRD and establish a pnpm web workspace and isolated
   Python 3.12 environment with dependency locks.
2. Configure PostgreSQL, health/readiness endpoints, Alembic, and synthetic fixtures.
3. Connect the web server to the API and provide a minimal interactive curriculum
   graph. Persist visual positions locally; label the scope honestly.
4. Verify builds, API behavior, solver runtime, browser behavior, mobile layout,
   formatting, and migration connectivity. Record actual evidence separately.
5. Configure CI, contributor guidance, issue/PR templates, README, and GitHub About.
6. Create a private GitHub repository under the authenticated owner using SSH,
   commit reviewed source and locks, push, and inspect CI results.

## Next product milestones

- Versioned curriculum and independent rule checker; choose a real curriculum source.
- Persisted plans with revisions, semester assignment, undo, and keyboard movement.
- Scenario overrides, bounded solver execution, independent output validation,
  and two-plan comparison where distinct feasible alternatives exist.
- Course goals/tasks and a timestamp-based focus timer.
- Decision Passport, student evaluation, deployment/access control, and final demo.

Each milestone needs its own acceptance checks. Avoid adding collaboration,
AI tutoring, or campus integration before the core recovery flow is validated.
