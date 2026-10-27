# Frontend and backend separation

## Result

`apps/web` moved to `frontend`; `apps/api` moved to `backend`. Dependency versions,
database schema, academic rules, and solver behavior are unchanged. Existing
local landing-page changes are preserved separately from the separation commit,
including the untracked footer component.
Binary preview assets were verified byte-for-byte against their original versions.

The browser calls `/api/v1` on `PUBLIC_API_BASE_URL` directly. SvelteKit universal
loaders use the same HTTP client for SSR and navigation. The remaining server
layout only initializes the browser workspace cookie. Import selects a new ID only
after success; switching verifies the target before updating the selected ID.
Workspace IDs remain local scoping state, not authentication.

FastAPI explicitly permits configured frontend origins and the `X-Workspace-ID`
header. Its synthetic fixture is bundled inside `backend/app/fixtures`, so the
backend needs no frontend or root-level data directory.

## Production SSR correction

The installed SvelteKit 3 / adapter-node 6 combination no longer uses the former
runtime `ORIGIN` setting. It uses `paths.origin` from the build configuration.
Without this, the Node adapter inferred HTTPS for a local HTTP server; browser
requests succeeded but SSR requests failed CORS checks.

The Vite configuration now reads `ORIGIN` into `paths.origin` before building.
The deployment guides explain the build-time requirement. End-to-end tests use
the production Node server instead of Vite development, avoiding cold optimizer
reloads and covering the actual deployment path.

## Verification

- `pnpm install --frozen-lockfile`: passed after updating the workspace importer,
  without changing package versions.
- `pnpm check`: zero errors and warnings.
- `pnpm build`: passed.
- `pnpm format:check`: passed.
- `uv --directory backend run ruff check .`: passed.
- `uv --directory backend run ruff format --check .`: passed.
- `uv --directory backend run pytest`: 21 passed. One upstream Starlette warning
  concerns the future replacement of its httpx test transport.
- `pnpm test:e2e`: 9 Chromium scenarios passed against separate production web/API
  processes. Used `E2E_API_PORT=28080`, `E2E_WEB_PORT=24173`, and `CI=1` because the
  default API port was already occupied. Existing database configuration was
  loaded into the child environment without copying or printing credentials.
- `git diff --check`: passed.

Browser checks cover direct API/CORS requests, SSR document loads, migration of
existing HttpOnly workspace cookies, invalid workspace switching, import and
workspace isolation, plan editing and persistence, recovery and comparison,
passport output, timer recovery, mobile layout, and failed-save draft recovery.

No migration was added or applied, no shared database/container was reconfigured,
and no public deployment was performed. Tests create fictional
workspaces in the existing dedicated Avenra database. Public access and real
student records remain outside this prototype's safety boundary.
