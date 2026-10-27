# Frontend and backend separation

## Approved scope

Keep one repository with independently runnable frontend and backend directories.
Preserve existing product behavior and in-progress landing-page edits. Do not commit,
push, provision infrastructure, or alter the shared PostgreSQL instance.

## Architecture

- `frontend/`: SvelteKit UI, browser workspace selection, typed HTTP client, and
  Playwright tests. No API proxy, database access, or academic-rule execution.
- `backend/`: FastAPI, schemas, persistence, migrations, academic validation,
  solver, and pytest tests. Bundle the synthetic fixture inside `backend/app/fixtures`
  so a backend deployment does not require another repository directory.
- Root: pnpm workspace and lockfile, developer shortcuts, CI, and documentation.
- Browser and SvelteKit SSR read FastAPI through `PUBLIC_API_BASE_URL`, using
  `/api/v1` and `X-Workspace-ID`. The API explicitly allows configured frontend
  origins through `CORS_ORIGINS`.

## Workspace behavior and errors

Retain existing workspace IDs. The frontend cookie is readable by JavaScript so
browser requests can use the same ID as SSR. This cookie is demo scoping state,
not a credential. Import uses a fresh ID and selects it only after success;
switching validates the target workspace before updating the cookie. Reloads,
plan drafts, timers, and workspace isolation must keep working.

Use one HTTP client for SSR reads and browser requests. Preserve API validation
messages and report timeouts/network failures without discarding unsaved edits.
This remains an unauthenticated local prototype, not a secure public service.

## Implementation and acceptance

1. Move application files without changing unrelated UI or dependency versions.
2. Replace proxy requests with direct HTTP; move page reads to universal loaders.
3. Configure CORS; update workspace, fixture, lockfile, CI, and documentation paths.
4. Run frozen dependency installation, frontend checks/build/formatting, backend
   lint/format/tests, and Playwright. Report any environment blockers explicitly.

Historical setup specifications retain their original folder names; current
setup instructions and agent guidance use the new names.
