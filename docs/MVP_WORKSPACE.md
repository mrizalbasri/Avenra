# Academic workspace MVP

The user requested a useful end-to-end application, support for different
Indonesian university curricula, and a pull request with separate commits.
This extends the foundation plan with operational local workflows.

## Implemented boundaries

- Each browser workspace has a distinct profile, curriculum, plans, study targets,
  and focus-session history. Users can remember and switch workspaces in the header.
- CSV import creates a new workspace without overwriting earlier records. Course
  references and cycles are checked, and imported rules remain user-supplied.
- All imported courses are required in the current model. Only simple prerequisite
  chains, credit caps, and odd/even offerings are supported. This cannot encode every
  institutional rule in Indonesia; unsupported policy cases need advisor review.
- Plans persist assignments and presentation coordinates separately. Cross-semester
  drag changes scheduling; same-semester drag changes presentation. Accessible select
  controls provide the same scheduling operation. Invalid exploratory drafts can be saved.
- Optimistic revisions reject stale plan/profile/task updates. Browser draft recovery
  retains failed saves, and undo/redo handles unsaved changes.
- A failed/postponed course overrides completion only inside a scenario. Dependency
  traversal explains downstream blockers. OR-Tools generates distinct options for
  earlier completion and lighter peak load. A separate checker validates each output.
- Comparison and the printable Decision Passport use saved snapshots. Export identifies
  profile/plan revisions, curriculum version, source, assumptions, findings, and advisor questions.
- Learning targets, dates, completion flags, and finished focus sessions persist in
  PostgreSQL. Timers calculate elapsed time from timestamps and restore paused after reload.

## Storage and migration

The existing `postgres-local` instance on port 5434 hosts database `avenra`.
Revisions 0002–0004 add profiles/plans/tasks/sessions, personal curriculum JSON,
and independent canvas coordinates. Existing tables in other databases are untouched.
Apply migrations before opening the app; no schema is auto-created at API startup.

## Privacy and release boundary

This is a local prototype. Workspace identifiers scope queries but are not login
credentials or proof of identity. The public-deployment gate still requires genuine
authentication and authorization, account recovery, data-retention decisions,
institutional rule validation, and user evaluation. No claimed learning gains or
competition outcome follows from these automated tests.

## Review guide

Backend: `backend/app/models.py`, `schemas.py`, `validation.py`, `solver.py`, `routes.py`.
Frontend: `frontend/src/routes/plans/[id]`, curriculum import, study timer, and
`frontend/src/lib/api.ts`. The frontend calls FastAPI directly over HTTP; no web
API proxy remains. SSR and browser calls use the same workspace ID and public API
origin, with CORS configured in the backend.
Check migration application, invalid drafts, timeout handling, cross-workspace
queries, failed saves, timer restoration, and export freshness.
