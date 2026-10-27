# Avenra frontend

SvelteKit UI with TypeScript, Svelte Flow, and Tailwind CSS. Requires Node 24 and
pnpm 11.18.0. Python and PostgreSQL are not needed to build or start this server.
Product data requires a running Avenra backend.

From the repository root:

```powershell
# First setup only; keep existing local configuration on subsequent runs.
Copy-Item frontend/.env.example frontend/.env
pnpm install --frozen-lockfile
pnpm dev:frontend
```

Or run `pnpm dev --host 127.0.0.1` from this directory.
Configure `PUBLIC_API_BASE_URL` with the backend origin, without `/api/v1`.
This is public configuration, not a secret. The browser and SSR server must both
be able to reach that origin. The backend must allow your frontend origin in
`CORS_ORIGINS`; no frontend API proxy is required.

## Checks and deployment

From the repository root, run `pnpm check`, `pnpm build`, and `pnpm test:e2e`.
The browser suite starts both services and requires Python and a migrated database;
see the root README for that setup.

The Node adapter produces `frontend/build`. Set `PUBLIC_API_BASE_URL` for the
deployment and run from this directory:

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:ORIGIN = 'http://127.0.0.1:3000'
pnpm build
node --env-file=.env build
```

SvelteKit 3 reads the configured origin into `paths.origin` at build time.
Set `ORIGIN` before building (in the environment or `.env`) and rebuild if it
changes. Setting it only when starting Node does not configure the origin.

The frontend uses its own cookie to remember a workspace and sends its ID through
`X-Workspace-ID`. It contains no API routes or database logic. Workspace IDs are
not authentication; this application is still a local prototype.
