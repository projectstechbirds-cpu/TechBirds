# TechBirds Platform

Monorepo for the TechBirds Group platform — marketing site, blog, employee portal, and API. Per `TechBirds_Master_Requirements_v3.docx`.

## Layout

```
apps/
  www/    Marketing site                — Vite + React + TS    (port 5173)
  blog/   Public journal                — Vite + React + TS    (port 5174)
  app/    Employee portal (OTP login)   — Vite + React + TS    (port 5175)
  api/    Backend API                   — FastAPI + SQLAlchemy (port 8002)
packages/
  ui-kit/   Design tokens, Tailwind preset, primitives
  content/  Static content (ventures, services, case studies)
  sdk/      Typed API client shared by all frontends
```

## Documentation

- **[Documentation index](docs/README.md)** — links to all guides below.
- **[Developer guide](docs/DEVELOPMENT.md)** — npm commands, API setup, dark theme tokens, troubleshooting.
- **[Launch checklist](LAUNCH_CHECKLIST.md)** — production server and DNS steps.

## Prerequisites

- **Node.js 20+** and **npm 10+** (workspaces)
- **Python 3.12+** (API)
- **PostgreSQL 16** (local or Docker)
- **Redis 7** (local or Docker)

## First-time setup

```bash
# 1. Install JS deps (from repo root)
npm install

# 2. API: virtualenv + deps
cd apps/api
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS/Linux
pip install -e ".[dev]"
cp .env.example .env

# 3. Database: create + migrate
createdb techbirds                 # or via your Postgres GUI
alembic upgrade head

# 4. Root .env (frontends)
cd ../..
cp .env.example .env
```

## Develop

```bash
# All packages that define "dev" (API + three Vites) — requires API .venv
npm run dev

# Frontends only (marketing, blog, portal)
npm run dev:web

# One workspace
npm run dev -w @techbirds/www
npm run dev -w @techbirds/blog
npm run dev -w @techbirds/app
```

API (from `apps/api`, with venv activated, or use the script invoked by `npm run dev` there):

```bash
cd apps/api
npm run dev
```

URLs:

- Marketing → http://localhost:5173
- Blog → http://localhost:5174
- Portal → http://localhost:5175
- API docs → http://localhost:8002/docs
- API health → http://localhost:8002/health

## Quality

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

API:

```bash
cd apps/api
ruff check .
pytest -q
```

## Phase status

| # | Phase                                       | Status     |
|---|---------------------------------------------|------------|
| 1 | Scaffold (monorepo, design system, API)     | ✅ done     |
| 2 | Marketing site (full content + contact)     | ✅ done     |
| 3 | Blog (CMS + reader + SEO)                   | ✅ done     |
| 4 | Auth (OTP) + employee shell + punch         | ✅ done     |
| 5 | Leave + holidays + birthdays + Feed         | ✅ done     |
| 6 | Payroll + payslips + 8 documents            | ✅ done     |
| 7 | Polish, security, SEO, infra, launch prep   | ✅ done     |
| 8 | CI/CD + backups                             | ✅ done     |

## Deployment

- Production env templates: [`apps/api/.env.production.example`](apps/api/.env.production.example) plus one per frontend.
- Nginx vhosts and systemd units live in [`infra/`](infra/).
- Step-by-step rollout: [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md).
- Nightly Postgres → R2 backup: [`infra/scripts/backup_db.sh`](infra/scripts/backup_db.sh) driven by `techbirds-backup.timer`.

## Pre-launch verification

1. `npm install` completes without errors.
2. `npm run dev:web` boots all three frontends (or `npm run dev` with API ready).
3. `cd apps/api && npm run dev` boots; `GET /health` returns JSON.
4. `alembic upgrade head` applies cleanly to a fresh database.
5. `npm run lint && npm run typecheck && npm run test` pass.
6. `cd apps/api && ruff check . && pytest -q` pass.
