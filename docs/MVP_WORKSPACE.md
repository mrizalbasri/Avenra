# Academic workspace MVP

The user requested a useful end-to-end application, support for different
Indonesian university curricula, and a pull request with separate commits.
This extends the foundation plan with operational local workflows.

## Implemented boundaries

- Each browser workspace has a distinct profile, curriculum, plans, study targets,
  and focus-session history. Users can remember and switch workspaces in the header.
- CSV import creates a new workspace without overwriting earlier records. Course
  references and cycles are checked, and imported rules remain user-supplied.
- Modeled rules: prerequisites (all-of and "A or B"), corequisites, earned-credit
  thresholds, required versus elective courses toward a graduation credit total,
  odd/even offerings, a maximum study period, and an IPS-based credit limit for the
  next semester. Exceptions, equivalent courses, and transfer credit need advisor review.
- The bundled S1 Informatika fixture (demo-3, 144 credits) is synthetic. Demo
  workspaces created before demo-3 keep the original 12-course fixture.
- Plans persist assignments and presentation coordinates separately. Cross-semester
  drag changes scheduling; same-semester drag changes presentation. Accessible select
  controls provide the same scheduling operation. Invalid exploratory drafts can be saved.
- Optimistic revisions reject stale plan/profile/task updates. Browser draft recovery
  retains failed saves, and undo/redo handles unsaved changes.
- A failed/postponed course overrides completion only inside a scenario. A course
  failed this semester is retaken from the next offered semester, and a scenario IPS
  can lower next semester's limit. Dependency traversal explains downstream blockers.
  OR-Tools generates distinct options for earlier completion and lighter peak load,
  each with a summary of how it differs. A separate checker validates each output.
  When no plan exists, the response names the blocking chain or credit shortfall and
  the smallest longer horizon or higher personal limit that works.
- Comparison and the printable Decision Passport use saved snapshots. Export identifies
  profile/plan revisions, curriculum version, source, assumptions, findings, and advisor questions.
- Learning targets, dates, completion flags, and finished focus sessions persist in
  PostgreSQL. Timers calculate elapsed time from timestamps and restore paused after reload.

## Storage and migration

The existing `postgres-local` instance on port 5434 hosts database `avenra`.
Revisions 0002–0005 add profiles/plans/tasks/sessions, personal curriculum JSON,
independent canvas coordinates, and profile/scenario IPS values. Existing tables in other databases are untouched.
Apply migrations before opening the app; with PostgreSQL no schema is auto-created
at API startup.

Local mode (`AVENRA_LOCAL=1`) is groundwork for a desktop build. The API then
ignores `DATABASE_URL`, keeps a SQLite file at `%APPDATA%\Avenra\avenra.db` on
Windows or `~/Library/Application Support/Avenra/avenra.db` on macOS
(`AVENRA_DATA_DIR` overrides it), and applies migrations itself on start.

## Graduation outlook and reminders

- `GET /api/v1/plans/{id}/outlook` compares the saved plan's completion semester with
  the curriculum's `target_terms` (default 8). When the plan still has rule findings
  it falls back to the earliest modeled finish and says so. It re-solves once per
  course planned this semester to flag courses whose failure would push the earliest
  modeled finish later, searching the full study period so a delay is a number of
  semesters. Only optimal solves count; a time-limited answer is reported as unknown
  and never flags a course. The Overview renders first and fills the outlook in.
- The Overview shows that outlook, the credits toward graduation, and a "Needs your
  attention" list: targets due within two days or overdue, critical courses without
  a study target, and rule findings in the first active plan.
- Study targets with a due date export to an `.ics` file with a reminder the evening
  before. Reminders inside Avenra appear only while it is open.
- Phones get a bottom tab bar, 44 px touch targets, 16 px inputs, and the semester
  board with the setback tools before it.

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
