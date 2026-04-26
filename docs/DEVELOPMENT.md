# TechBirds Platform — Developer guide

This monorepo uses **npm workspaces** (Node 20+, npm 10+) and **Turbo** for orchestration. The root `package.json` includes `"packageManager": "npm@10.9.3"` so Turbo can resolve workspaces. Internal packages (`@techbirds/*`) are referenced with **`"*"`** in app `package.json` files so `npm install` works reliably on all platforms (the `workspace:` protocol can fail on some npm setups).

Python packages for the API live under `apps/api` (see below).

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/www` | Marketing site (Vite, port **5173**) |
| `apps/blog` | Public blog (Vite, port **5174**) |
| `apps/app` | Employee portal, OTP auth (Vite, port **5175**) |
| `apps/api` | FastAPI backend (port **8002** when run locally) |
| `packages/ui-kit` | Design tokens (`tokens.css`), Tailwind preset, shared UI |
| `packages/content` | Static marketing content |
| `packages/sdk` | Typed HTTP client for the API |

Further reading: root [`README.md`](../README.md), deployment [`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md).

**Hosts and routes** are summarized in code as `SITE_URLS`, `marketingPaths`, `blogPaths`, and `portalPaths` (exported from `@techbirds/content`) so nav, footers, and docs stay aligned with production subdomains.

## Install (JavaScript)

From the repository root:

```bash
npm install
```

CI uses `npm ci` with a committed `package-lock.json`. After changing workspace `package.json` files, run `npm install` locally and commit the updated lockfile.

## Common commands

| Goal | Command |
|------|---------|
| All default `dev` tasks (API + three Vites) | `npm run dev` |
| Frontends only (no Python API) | `npm run dev:web` |
| Single app | `npm run dev -w @techbirds/www` (or `blog` / `app`) |
| Lint / typecheck / test / build (via Turbo) | `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` |
| Clean Turbo outputs + root `node_modules` | `npm run clean` |

Turbo filters (same as before): e.g. `npx turbo run build --filter=@techbirds/www`.

## API (Python)

Requirements: **Python 3.12+**, PostgreSQL, Redis (see root README).

```bash
cd apps/api
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# configure DATABASE_* and REDIS_* then:
alembic upgrade head
```

From `apps/api`, start the server with `npm run dev` (uses `.venv` via `scripts/run-dev.cjs`). From the monorepo root, `npm run dev` includes the API if the venv exists and installs succeeded.

## UI theme (dark / black)

Product UIs use shared tokens in `packages/ui-kit/src/tokens/tokens.css`. Dark surfaces are enabled by the **`.dark`** class (or `data-theme="dark"` on `:root`), which maps to near-black paper (`#06080c`) and light ink for text.

All three Vite apps set **`<html class="dark">`** so local dev and builds default to the dark theme. To switch an app to light mode for experiments, remove that class or set `data-theme` explicitly in `index.html`.

Tailwind `dark:` variants are configured in `packages/ui-kit/src/tailwind-preset.ts` (`darkMode: ["class", '[data-theme="dark"]']`).

## Environment files

- **Root** `.env` — copy from `.env.example`; supplies `VITE_*` URLs to the frontends.
- **`apps/api/.env`** — copy from `apps/api/.env.example`; database, Redis, secrets, email, etc.

Never commit real `.env` files.

## Troubleshooting

- **`npm run dev` fails on `@techbirds/api`:** Ensure `apps/api/.venv` exists and `pip install -e ".[dev]"` completed with Python 3.12+.
- **Port already in use:** Stop other Vite/Node processes or change the port in the relevant app’s `package.json` `dev` script.
- **CSS / Fontsource errors on www:** `@fontsource-variable/*` packages are dependencies of `@techbirds/ui-kit` so imports from `ui-kit/fonts.css` resolve correctly under npm workspaces.
