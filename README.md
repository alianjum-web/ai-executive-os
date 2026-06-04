# AI Executive OS & SOP Automator

Monorepo for an AI-powered executive operating system: document ingest (RAG), streaming chat with citations, analytics, and integrations (Slack, Jira, email).

**New developer?** Read this file top to bottom once, then use the [cheat sheet](#cheat-sheet) daily.

---

## Table of contents

1. [How the project fits together](#how-the-project-fits-together)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [Environment files (local vs production)](#environment-files-local-vs-production)
5. [First-time setup](#first-time-setup)
6. [Every day — start the app](#every-day--start-the-app)
7. [Health checks](#health-checks)
8. [**Dev vs production — full guide**](#dev-vs-production--full-guide) ← check prod on laptop
9. [Backend commands (`backend/package.json`)](#backend-commands-backendpackagejson)
10. [Frontend commands (`frontend/package.json`)](#frontend-commands-frontendpackagejson)
11. [Alternative: full stack in Docker](#alternative-full-stack-in-docker)
12. [How chat and auth work](#how-chat-and-auth-work)
13. [Troubleshooting](#troubleshooting)
14. [Tests and deeper docs](#tests-and-deeper-docs)
15. [API reference (summary)](#api-reference-summary)

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

**Local dev recommendation:** Postgres in Docker on host port **5433**, Redis on **6379** (often already installed on Linux). Supabase URL stays in `.env` for **JWT verification**, not necessarily for `DATABASE_URL`.

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

## Environment files (local vs production)

Copy **example** files (committed). Edit **active** files (gitignored).

| Mode | Backend | Frontend |
|------|---------|----------|
| **Local dev (recommended)** | `backend/.env` ← `backend/.env.example` | `frontend/.env.local` ← `frontend/.env.example` |
| **Production (split deploy)** | `backend/.env` on server | Host env / `frontend/.env.production` |
| **All Docker** | `docker/.env` ← `docker/.env.example` | Vars in same `docker/.env` |

### Local `backend/.env` (minimum)

```env
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/sop_automator
REDIS_URL=redis://127.0.0.1:6379/0
CORS_ORIGINS=http://localhost:3000
ENCRYPTION_KEY=<generate — see below>
SUPABASE_URL=https://<your-project>.supabase.co
GEMINI_API_KEY=<if ai_provider is gemini>
```

Generate encryption key:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Local `frontend/.env.local` (minimum)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

Full variable list: [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) · Quick copy-paste: [`docs/ENV_QUICK_START.md`](docs/ENV_QUICK_START.md)

Production templates (commit-safe): `backend/.env.production.example`, `frontend/.env.production.example`

---

## Dev vs production — full guide

**Read this when you want to test `APP_ENV=production` on your laptop** or compare dev vs prod checks.

→ **[`docs/DEV_VS_PRODUCTION.md`](docs/DEV_VS_PRODUCTION.md)** (complete step-by-step, checklists, switching `.env` files)

Quick commands:

```bash
# Verify development
cd backend && npm run check:env && npm run db:check
cd frontend && npm run dev

# Verify production rules (before/after copying .env.production → .env)
cd backend && npm run check:prod && npm run db:check
```

| Check | Command | Pass means |
|-------|---------|------------|
| Dev config | `npm run check:env` | `APP_ENV=development`, keys OK |
| Prod config | `npm run check:prod` | Production rules satisfied |
| DB + Redis | `npm run db:check` | Services reachable |
| API up | `curl http://127.0.0.1:8000/api/v1/health` | HTTP 200 + healthy body |

---

## First-time setup

Run these **once per machine** (or after cloning the repo).

### 1. Clone and open the repo

```bash
cd ~/Documents/GitHub/ai-executive-os   # your clone path
```

### 2. Backend — first time only

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`: add `ENCRYPTION_KEY`, `SUPABASE_URL`, `GEMINI_API_KEY` (or other LLM key), and keep local `DATABASE_URL` / `REDIS_URL` as in the example above.

```bash
npm run bootstrap
```

What `bootstrap` does (in order):

1. `npm run deps:docker` — starts **Postgres** container (host port **5433**)
2. `npm run setup` — Python `.venv` + `pip install` + `npm install` (for `concurrently`)
3. `npm run db:migrate` — Alembic migrations on local DB

### 3. Frontend — first time only

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` with your Supabase URL and anon key.

```bash
npm install
```

### 4. Verify (optional but recommended)

```bash
cd ../backend
npm run db:check
curl -s http://127.0.0.1:8000/api/v1/health   # after starting backend once — see below
```

---

## Every day — start the app

Use **two terminals**. You do **not** need `bootstrap` again unless you deleted `.venv`, changed major deps, or need a fresh DB container.

### Terminal 1 — Backend

```bash
cd ~/Documents/GitHub/ai-executive-os/backend

# Only if Docker Postgres was stopped (e.g. after reboot):
npm run deps:docker

# Start API (hot reload) + Celery worker + migrate + preflight checks:
npm run dev
```

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/api/v1/health | Health check |
| http://127.0.0.1:8000/docs | Swagger / OpenAPI |

### Terminal 2 — Frontend

```bash
cd ~/Documents/GitHub/ai-executive-os/frontend
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Web app — sign in, chat, upload |

**Chat:** sign in with Supabase → open chat → ask a question. For useful RAG answers, upload at least one document (ingest uses Celery from `npm run dev`).

---

## Cheat sheet

| When | Where | Command |
|------|--------|---------|
| **First time** | `backend/` | `cp .env.example .env` → edit → `npm run bootstrap` |
| **First time** | `frontend/` | `cp .env.example .env.local` → edit → `npm install` |
| **Every session** | `backend/` | `npm run deps:docker` (if DB container down) → `npm run dev` |
| **Every session** | `frontend/` | `npm run dev` |
| **Check DB/Redis** | `backend/` | `npm run db:check` |
| **Migrations only** | `backend/` | `npm run db:migrate` |
| **API only (no Celery)** | `backend/` | `npm run dev:api` |

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

## Backend commands (`backend/package.json`)

All commands run from **`backend/`** directory.

| Script | First time only? | What it does |
|--------|------------------|--------------|
| `npm run bootstrap` | **Yes** | Docker Postgres + `setup` + `db:migrate` |
| `npm run setup` | **Yes** (or if `.venv` missing) | `python3 -m venv .venv` + pip + npm deps |
| `npm run deps:docker` | As needed | Start Postgres container (port **5433**) |
| `npm run deps:docker:all` | As needed | Postgres + Redis container (Redis on **6380**) |
| `npm run db:migrate` | Auto in `dev` | `alembic upgrade head` |
| `npm run db:check` | Auto in `dev` | Test Postgres + Redis from `.env` |
| `npm run check:env` | Anytime | Validate development env |
| `npm run check:prod` | Before prod test | Validate production env |
| `npm run dev` | **Daily** | `db:check` → `db:migrate` → API `--reload` + Celery |
| `npm run dev:api` | Daily | Same preflight, API only (no Celery) |
| `npm run api` | — | Uvicorn only |
| `npm run worker` | — | Celery only |

More detail: [`backend/README.md`](backend/README.md)

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

## Frontend commands (`frontend/package.json`)

All commands run from **`frontend/`** directory.

| Script | First time only? | What it does |
|--------|------------------|--------------|
| `npm install` | **Yes** | Install dependencies |
| `npm run dev` | **Daily** | Next.js dev server on :3000 (hot reload) |
| `npm run build` | Deploy | Production build |
| `npm run start` | Deploy | Run production build |
| `npm test` | — | Jest unit tests |
| `npm run test:e2e` | — | Playwright E2E |

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

1. User signs in on the frontend via **Supabase Auth** (`frontend/.env.local`).
2. Chat calls `POST /api/v1/query/stream` with `Authorization: Bearer <access_token>` (`frontend/src/hooks/useQueryStream.ts`).
3. Backend verifies JWT using **`SUPABASE_URL`** (JWKS) — see `backend/app/core/supabase_jwt.py`.
4. User must have `org_id` and `role` in Supabase `user_metadata` (set at sign-up).
5. RAG reads chunks from **Postgres** for that `org_id`; LLM key comes from `backend/.env` per `ai_provider`.

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
| Chat 401 | Not logged in or `SUPABASE_URL` mismatch | Align backend `SUPABASE_URL` with frontend project |
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
| [`docs/DEV_VS_PRODUCTION.md`](docs/DEV_VS_PRODUCTION.md) | **Dev vs prod checks, `.env.production`, local prod test** |
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
3. Set frontend `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
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
2. `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `DEFAULT_ORG_ID` in backend `.env`
