# AI Executive OS & SOP Automator

Monorepo for an AI-powered executive operating system: document ingest (RAG), streaming chat with citations, analytics, and integrations (Slack, Jira, email).

**New developer?** Read this file top to bottom once, then use the [cheat sheet](#cheat-sheet) daily.

---

## Table of contents

1. [How the project fits together](#how-the-project-fits-together)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [**New developer — one-page start**](#new-developer--one-page-start)
5. [Environment files: dev vs production](#environment-files-dev-vs-production)
6. [What changes between dev and production env](#what-changes-between-dev-and-production-env)
7. [First-time setup (once per machine)](#first-time-setup-once-per-machine)
8. [Every day — start dev or production](#every-day--start-dev-or-production)
9. [Command cheat sheet](#command-cheat-sheet)
10. [Health checks](#health-checks)
11. [Backend & frontend scripts](#backend--frontend-scripts)
12. [Core code files](#core-code-files)
13. [Alternative: full stack in Docker](#alternative-full-stack-in-docker)
14. [How chat and auth work](#how-chat-and-auth-work)
15. [Troubleshooting](#troubleshooting)
16. [Tests and deeper docs](#tests-and-deeper-docs)
17. [API reference (summary)](#api-reference-summary)

---

## How the project fits together

```text
┌─────────────────┐     Supabase JWT      ┌──────────────────┐
│  frontend/      │ ────────────────────► │  backend/        │
│  Next.js :3000  │     POST /query/stream │  FastAPI :8000   │
└────────┬────────┘                       └────────┬─────────┘
         │                                           │
         │  NEXT_PUBLIC_API_URL                      │  DATABASE_URL
         ▼                                           ▼
                              ┌─────────────────────────────┐
                              │  PostgreSQL (pgvector)      │
                              │  local Docker :5433 or host │
                              └─────────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │  Redis :6379            │
                              │  Celery worker (ingest) │
                              └─────────────────────────┘
```

| Layer | Role |
|-------|------|
| **Frontend** | UI, login (Supabase), chat SSE, document upload, dashboards |
| **Backend API** | Auth, RAG query/stream, ingest API, webhooks, settings |
| **Celery worker** | Background document chunking + embeddings (needs Redis) |
| **Postgres** | App data: users, orgs, documents, chunks, vectors, tickets |
| **Supabase** | **Auth only** in typical local dev (JWT). Optional hosted DB in production |
| **Redis** | Celery broker + RAG cache |

**Local dev recommendation:** Postgres in Docker on host port **5433**, Redis on **6379** (or Docker **6380**). Supabase is used for **auth (JWT)** in both modes; only `DATABASE_URL` usually changes between dev (local) and production (hosted).

---

## New developer — one-page start

### First time only (clone → env → install → database)

Run from the **repo root** (`ai-executive-os/`):

```bash
git clone <repo-url> ai-executive-os
cd ai-executive-os

# 1) Install root tooling (runs backend + frontend together later)
npm install

# 2) Create env files (never commit these — they are gitignored)
cp backend/.env.example backend/.env.dev
cp frontend/.env.example frontend/.env.dev

# 3) Edit both files — same Supabase project, keys from dashboard (see below)
# 4) Python venv + npm deps + first migration
npm run setup
cd backend && npm run bootstrap
cd ..
```

`bootstrap` starts Docker Postgres, creates `.venv`, installs Python packages, runs Alembic on **local** DB (`127.0.0.1:5433`).

**Production env (optional, for testing prod on laptop):**

```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
# Fill with Session pooler DATABASE_URL, Upstash REDIS_URL, API keys — see docs/SUPABASE_REMOTE_DATABASE.md
```

### Every day after that — one command starts everything

| Mode | Command (repo root) | Env files used |
|------|---------------------|----------------|
| **Development** | `npm run dev` | `backend/.env.dev` + `frontend/.env.dev` |
| **Production-like** | `npm run prod` | `backend/.env.production` + `frontend/.env.production` |

Both commands start **backend (API + Celery)** and **frontend (Next.js)** in one terminal.

**Or run separately** (two terminals):

```bash
# Terminal 1 — backend
cd backend && npm run dev    # or: npm run prod

# Terminal 2 — frontend
cd frontend && npm run dev   # or: npm run prod
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://127.0.0.1:8000/docs | API (Swagger) |
| http://127.0.0.1:8000/api/v1/health | Health check |

---

## Repository layout

| Path | Stack | Purpose |
|------|--------|---------|
| [`frontend/`](frontend/) | Next.js 16, Redux, Supabase SSR | Web app — chat, upload, analytics |
| [`backend/`](backend/) | FastAPI, LangGraph, Celery, Alembic | REST API + workers + migrations |
| [`docker/`](docker/) | Docker Compose | Optional all-in-one local/prod stack |
| [`docs/`](docs/) | Markdown | Env vars, feature flags, security, master spec |
| [`backend/config/features.json`](backend/config/features.json) | JSON | Feature flags + `ai_provider` (gemini, openai, …) |

Backend dev scripts live in [`backend/package.json`](backend/package.json) (same idea as frontend `npm run` scripts): one command can chain steps (`&&`) or run API + Celery in parallel (`concurrently`). API hot reload uses `uvicorn --reload` (like nodemon for Python).

---

## Prerequisites

Install before first-time setup:

| Tool | Version | Used for |
|------|---------|----------|
| **Node.js** | 18+ | `npm run dev` in `frontend/` and `backend/` |
| **Python** | 3.12+ (`python3`) | FastAPI, Alembic, Celery |
| **Docker** | recent | Local Postgres (pgvector) via Compose |
| **Redis** | optional local | Port `6379` — or Docker on `6380` (see [Troubleshooting](#troubleshooting)) |

Accounts / keys you will need:

- [Supabase](https://supabase.com) project (auth for frontend + backend JWT verify)
- LLM API key matching `ai_provider` in `backend/config/features.json` (default: **gemini** → `GEMINI_API_KEY`)
- Fernet `ENCRYPTION_KEY` for settings/integrations (generate once)

---

## Environment files: dev vs production

We use **two active env files per app**:

```text
backend/.env.dev          → npm run dev
backend/.env.production   → npm run prod
frontend/.env.dev         → npm run dev
frontend/.env.production  → npm run prod
```

Copy from examples: `backend/.env.example`, `frontend/.env.example`, `backend/.env.production.example`, `frontend/.env.production.example`.

### Minimum `backend/.env.dev`

```env
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/sop_automator
REDIS_URL=redis://127.0.0.1:6379/0
CORS_ORIGINS=http://localhost:3000
ENCRYPTION_KEY=<generate — see below>
SUPABASE_URL=https://<project-ref>.supabase.co
GEMINI_API_KEY=<if ai_provider is gemini>
```

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Minimum `frontend/.env.dev`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from Supabase dashboard>
```

Full list: [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md)

---

## What changes between dev and production env

| Variable | Development | Production |
|----------|-------------|------------|
| `APP_ENV` | `development` | `production` |
| `DATABASE_URL` | Local Docker `:5433` | Supabase Session pooler URI |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Upstash `rediss://…` |
| `CORS_ORIGINS` | `http://localhost:3000` | Prod domain (or localhost for local prod test) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` (no `/rest/v1/`) | Same project root URL |
| LLM keys (`GEMINI_API_KEY`, …) | Usually same or separate prod key | |
| `NEXT_PUBLIC_*` | Local API + Supabase | Prod API URL or localhost when testing |

**Behavior:** dev allows optional `X-Org-Id` headers; production requires Supabase JWT only.

**Switching:** keep both files; run `npm run dev` or `npm run prod` — do not overwrite one file.

→ [`docs/DEV_VS_PRODUCTION.md`](docs/DEV_VS_PRODUCTION.md) · [`docs/SUPABASE_REMOTE_DATABASE.md`](docs/SUPABASE_REMOTE_DATABASE.md)

---

## First-time setup (once per machine)

See [New developer — one-page start](#new-developer--one-page-start).

---

## Every day — start dev or production

| Mode | Repo root (one command) | Separate terminals |
|------|-------------------------|-------------------|
| **Dev** | `npm run dev` | `cd backend && npm run dev` + `cd frontend && npm run dev` |
| **Prod** | `npm run prod` | `cd backend && npm run prod` + `cd frontend && npm run prod` |

After reboot, if DB is down: `cd backend && npm run deps:docker:all` then `npm run dev`.

---

## Command cheat sheet

| When | Command |
|------|---------|
| **First time** | `npm install && npm run setup && cd backend && npm run bootstrap` |
| **Copy dev env** | `cp backend/.env.example backend/.env.dev` and `cp frontend/.env.example frontend/.env.dev` |
| **Every day — dev** | `npm run dev` |
| **Every day — prod** | `npm run prod` |
| **Verify prod env** | `cd backend && npm run verify:supabase && npm run check:prod` |

---

## Health checks

Run after `npm run dev` (backend) is up:

```bash
# Backend
curl -s http://127.0.0.1:8000/api/v1/health

# Postgres (must match DATABASE_URL port)
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -d sop_automator -c "SELECT 1;"

# Redis
redis-cli -h 127.0.0.1 -p 6379 ping    # expect PONG
```

Frontend: open http://localhost:3000 — if login loads, Supabase env vars are wired.

---

## Backend & frontend scripts

### Backend (`backend/package.json`) — uses `ENV_FILE=.env.dev` or `.env.production`

| Script | What it does |
|--------|----------------|
| `npm run bootstrap` | **First time:** Docker Postgres + `setup` + migrate (`.env.dev`) |
| `npm run setup` | Python `.venv` + pip + npm deps |
| `npm run dev` | Full dev stack: checks → migrate → API + Celery |
| `npm run prod` | Full prod stack: verify Supabase → checks → migrate remote → API + Celery |
| `npm run deps:docker:all` | Start Postgres (**5433**) + Redis (**6380**) |

More: [`backend/README.md`](backend/README.md)

### Manual backend (without npm scripts)

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# second terminal:
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

---

### Frontend (`frontend/package.json`) — loads `.env.dev` or `.env.production` via shell

| Script | What it does |
|--------|----------------|
| `npm run dev` | Next.js dev server `:3000` with **`.env.dev`** |
| `npm run prod` | Next.js dev server with **`.env.production`** (local prod test) |
| `npm run build:prod` | Production build with `.env.production` |

---

## Core code files

Where to look when debugging — see [`docs/CORE_FILES.md`](docs/CORE_FILES.md).

| Layer | Main files |
|-------|------------|
| **Backend** | `app/main.py`, `app/core/security.py`, `app/core/tenant_sync.py` |
| **Frontend** | `src/proxy.ts`, `src/auth/organisms/AuthProvider.tsx`, `src/auth/services/auth.service.ts` |

---

## Alternative: full stack in Docker

Runs frontend + API + worker + Postgres + Redis together (no separate `npm run dev` on host).

```bash
cp docker/.env.example docker/.env
# Fill keys in docker/.env

cd docker
docker compose up --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:8000/api/v1/health  
- Docs: http://localhost:8000/docs  

---

## How chat and auth work

1. User signs in on the frontend via **Supabase Auth** (`frontend/.env.dev` or `.env.production`).
2. Chat calls `POST /api/v1/query/stream` with `Authorization: Bearer <access_token>` (`frontend/src/hooks/useQueryStream.ts`).
3. Backend verifies JWT using **`SUPABASE_URL`** (JWKS) — see `backend/app/core/supabase_jwt.py`.
4. User must have `org_id` and `role` in Supabase `user_metadata` (set at sign-up).
5. RAG reads chunks from **Postgres** for that `org_id`; LLM key comes from `backend/.env.dev` (or `.env.production`) per `ai_provider`.

**Local dev shortcut:** with `APP_ENV=development`, the API also accepts headers `X-Org-Id`, `X-User-Id`, `X-User-Role` without a JWT (normal UI still uses Supabase login).

**Do not** point `DATABASE_URL` at Supabase hosted DB for local dev unless your network can reach it (IPv6/pooler issues are common). Use Docker Postgres on `127.0.0.1:5433` and keep Supabase for auth only.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `password authentication failed` on :5432 | System Postgres on 5432, not Docker | Use `DATABASE_URL` with port **5433** and `npm run deps:docker` |
| `Network is unreachable` to `db.*.supabase.co` | Remote Supabase DB from laptop | Use local `DATABASE_URL` on `127.0.0.1:5433` for dev |
| `address already in use` :6379 | Local Redis already running | Set `REDIS_URL=redis://127.0.0.1:6379/0`; skip Docker Redis |
| `address already in use` :6379 with Docker | Port conflict | Use `npm run deps:docker:all` (Redis on **6380**) and `REDIS_URL=redis://127.0.0.1:6380/0` |
| `cd backend: No such file or directory` | Already inside `backend/` | Run commands without extra `cd backend` |
| Chat 401 | Not logged in or `SUPABASE_URL` mismatch | Same project in backend + frontend; URL must be `https://<ref>.supabase.co` not `/rest/v1/` |
| `duplicate key organizations_pkey` | Parallel API calls on login | Pull latest `tenant_sync.py`; restart `npm run prod` |
| Celery `rediss:// ssl_cert_reqs` | Upstash without SSL param | Fixed in code — restart backend |
| Chat 500 | Missing LLM API key | Add `GEMINI_API_KEY` (or key for your `ai_provider`) |
| Empty chat answers | No documents | Upload a PDF/DOCX via UI (needs Celery in `npm run dev`) |

Supabase **IP allowlisting** is usually **not** required unless you enabled Network Restrictions in the dashboard. Connection errors to `db.*.supabase.co` are often network/IPv6, not whitelist.

---

## Tests and deeper docs

```bash
cd backend && pytest
cd frontend && npm test
cd frontend && npm run test:e2e   # optional live stack: E2E_RUN_LIVE=1
```

| Document | Content |
|----------|---------|
| [`docs/DEV_VS_PRODUCTION.md`](docs/DEV_VS_PRODUCTION.md) | **Dev vs prod checks, switching env** |
| [`docs/SUPABASE_REMOTE_DATABASE.md`](docs/SUPABASE_REMOTE_DATABASE.md) | Session pooler `DATABASE_URL` for production |
| [`docs/CORE_FILES.md`](docs/CORE_FILES.md) | Main backend/frontend logic files |
| [`docs/PROJECT_MASTER.md`](docs/PROJECT_MASTER.md) | Product vision, architecture, sprints |
| [`docs/ENV_QUICK_START.md`](docs/ENV_QUICK_START.md) | Env templates + full-app start |
| [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) | All env vars |
| [`docs/FEATURE_FLAGS.md`](docs/FEATURE_FLAGS.md) | Feature flags |
| [`frontend/docs/PROJECT_MASTER.md`](frontend/docs/PROJECT_MASTER.md) | Frontend-specific notes |

---

## API reference (summary)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/health` | — | Health check |
| `POST` | `/api/v1/ingest` | Admin | Upload PDF/DOCX/MD → 202 + Celery job |
| `GET` | `/api/v1/documents` | User | List documents (org-scoped) |
| `DELETE` | `/api/v1/documents/{id}` | Admin | Delete document + chunks/embeddings |
| `POST` | `/api/v1/query` | User | RAG answer + citations |
| `POST` | `/api/v1/query/stream` | User | SSE token stream + citations |
| `GET` | `/api/v1/analytics/dashboard` | Admin | Queries today, latency, top questions |
| `POST` | `/api/v1/webhook/slack` | Slack HMAC | Slack Events API |
| `GET` | `/api/v1/tickets` | User | Org-scoped ticket feed |

### Streaming format (`/query/stream`)

```text
data: {"type":"token","content":"Hello"}

data: {"type":"done","answer":"...","citations":[...],"latency_ms":120}
```

### RAG pipeline

1. Vector retrieve (top 10, org-filtered)  
2. LLM relevance grade 1–5 (drop ≤2)  
3. Cohere Rerank (fallback: grade/score sort)  
4. LLM answer + citation cards (chunk_id, chunk_text, page)

---

## Auth (Supabase) setup

1. Create a project at [supabase.com](https://supabase.com)  
2. Enable Email auth  
3. Set frontend `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.dev`  
4. Set backend `SUPABASE_URL` (same project) for JWT verification  
5. Sign-up flow sets `org_id` / `role` in user metadata  

Production JWT payload shape:

```json
{
  "user_metadata": {
    "org_id": "uuid",
    "role": "admin"
  }
}
```

---

## Feature flags (defaults)

Configured in `backend/config/features.json` (mirrored in frontend config). Examples:

| Flag | Default |
|------|---------|
| `KNOWLEDGE_AGENT_ENABLED` | true |
| `DOCUMENT_UPLOAD_ENABLED` | true |
| `MULTI_TENANT_ENABLED` | true |
| `ANALYTICS_DASHBOARD_ENABLED` | true |
| `SLACK_WEBHOOK_ENABLED` | true |

Live API: `GET /api/v1/config/features`

---

## Slack setup (optional)

1. [api.slack.com/apps](https://api.slack.com/apps) → Event Subscriptions → `https://<api>/api/v1/webhook/slack`  
2. `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `DEFAULT_ORG_ID` in `backend/.env.dev` or `.env.production`
