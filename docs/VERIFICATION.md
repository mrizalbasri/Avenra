# Foundation verification

## Academic workspace MVP

Verified on 27 October 2026 against the functional local workspace:

- Backend: 16 tests passed. Includes imported curriculum scoping, invalid graph
  rejection, plan and visual-coordinate persistence, stale revisions, prerequisite
  and credit violations, offering constraints, distinct independently checked
  recovery results, infeasible/timeout separation, and study-session idempotency.
- Browser: 6 Chromium tests passed. Includes board movement/undo/redo/reload,
  canvas drag, recovery-to-comparison-to-passport, curriculum import and switching,
  target completion, timer recovery, failed-save draft restoration, and mobile
  overflow checks across all main routes.
- `pnpm check`: zero errors and warnings. Production Node build passed.
- Ruff lint/format and Prettier passed. Design detector reported no findings.
- PostgreSQL `avenra` in the existing `postgres-local:5434` instance migrated to
  revision `0004`; no other project databases were modified.
- Desktop canvas, learning workspace, mobile overview, and print-layout screenshots
  were inspected. Review images are stored in `docs/screenshots`.

These are engineering checks using fictional academic data and a test curriculum,
not validation of actual Indonesian university policy or measured student outcomes.
Imported curricula remain user-supplied. Workspace identifiers are not authentication.
GitHub CI must be checked on the current PR head separately.

The earlier sections below retain foundation verification history.

## Shared PostgreSQL correction

The local setup now reuses PostgreSQL 18 in `postgres-local` on port 5434 with
database `avenra`. Alembic revision 0001 was applied there. The original isolated
container was stopped and its volume retained. Other databases are unchanged.
The original foundation checks below describe the earlier isolated setup;
readiness and migrations are rechecked against the shared database after switching.

Verified locally on 27 October 2026, Windows, Node 24.11.1, pnpm 11.18.0,
Python 3.12.4, and Docker Desktop Linux engine.

| Check                            | Result                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Frontend type/Svelte check       | Passed; zero errors and warnings                                                     |
| Standalone Node production build | Passed                                                                               |
| Prettier check                   | Passed                                                                               |
| Ruff lint and formatting         | Passed                                                                               |
| Backend tests                    | 5 passed                                                                             |
| Chromium end-to-end tests        | 2 passed                                                                             |
| PostgreSQL health check          | Healthy on local port 55432                                                          |
| Alembic migration                | Revision 0001 at head                                                                |
| Live database outage/recovery    | Readiness 200 → 503 → 200 after stopping/restarting only Avenra's database           |
| Desktop/mobile inspection        | Inspected rendered workspace screenshots; mobile viewport has no horizontal overflow |
| Ignore rules                     | Local environment files, virtualenv, dependencies, and browser artifacts excluded    |

The API uses port 18080 because port 8000 was already occupied by another local
service. No unrelated service was stopped. The dev web server uses port 5173.

The backend test client emits a dependency deprecation warning about its httpx
transport. Tests pass; this warning is not evidence of a runtime failure.

The solver test is a tiny prerequisite-order problem only. Academic validation,
plan persistence, recovery generation, comparison, export, and study tools remain
unimplemented. Synthetic fixtures are not institutional curriculum evidence.

GitHub Actions performs the configured checks separately on Linux; its run
status must be verified on GitHub rather than inferred from these local results.
