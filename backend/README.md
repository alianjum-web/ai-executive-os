# Backend (FastAPI)

Python API, LangGraph agents, Celery workers, Alembic migrations.

## Shared documentation (repo root)

| Document | Path |
|----------|------|
| Engineering master | [`../docs/PROJECT_MASTER.md`](../docs/PROJECT_MASTER.md) |
| Environment variables | [`../docs/ENVIRONMENT_VARIABLES.md`](../docs/ENVIRONMENT_VARIABLES.md) |
| Env quick start | [`../docs/ENV_QUICK_START.md`](../docs/ENV_QUICK_START.md) |
| Docs index | [`../docs/README.md`](../docs/README.md) |

## Prerequisites

1. **Config:** `cp .env.example .env` and fill in values (see [`../docs/ENV_QUICK_START.md`](../docs/ENV_QUICK_START.md)).
2. **Postgres + Redis:** Either Docker (`npm run deps:docker`) or your own instances matching `DATABASE_URL` / `REDIS_URL`.
3. **Node.js:** Only for `npm run` scripts (orchestration). Python 3.12+ via `python3`.

Default Docker credentials (see `docker/docker-compose.yml`):

| Setting | Value |
|---------|--------|
| User / password | `postgres` / `postgres` |
| Database | `sop_automator` |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/sop_automator` |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` (or `:6380` if using Docker Redis) |

**Full onboarding:** [`../README.md`](../README.md) · **Dev vs production checks:** [`../docs/DEV_VS_PRODUCTION.md`](../docs/DEV_VS_PRODUCTION.md)

### Verify environment

```bash
npm run check:env    # development rules
npm run check:prod   # production rules (use before prod test)
npm run db:check     # Postgres + Redis reachable
```

Verify DB login:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -d sop_automator -c "SELECT 1;"
```

## Dev commands (`package.json`)

Same idea as the frontend: one command runs a chain (`&&`) or parallel processes (`concurrently`).  
`uvicorn --reload` is the hot-reload dev server (like nodemon).

| Command | What it does |
|---------|----------------|
| `npm run bootstrap` | First time: Docker Postgres/Redis → venv + pip → npm deps → migrations |
| `npm run setup` | Create `.venv`, install Python + npm dev deps |
| `npm run deps:docker` | Start Postgres container (host port 5433) |
| `npm run deps:docker:all` | Postgres + Redis (Redis on host 6380) |
| `npm run db:check` | Preflight: test Postgres + Redis from `.env` |
| `npm run check:env` | Validate development env |
| `npm run check:prod` | Validate production env |
| `npm run db:migrate` | `alembic upgrade head` |
| `npm run dev` | Preflight + migrate → API (**reload**) + Celery worker |
| `npm run dev:api` | Preflight + migrate → API only (no Celery) |
| `npm run api` | Uvicorn only (assumes DB already OK) |
| `npm run worker` | Celery worker only |

### Typical workflow

```bash
cd backend
cp .env.example .env   # edit secrets / URLs

# Once
npm run bootstrap

# Every dev session (single terminal)
npm run dev
```

- API: http://127.0.0.1:8000  
- Health: http://127.0.0.1:8000/api/v1/health  
- OpenAPI: http://127.0.0.1:8000/docs  

### Manual (without npm)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
# second terminal:
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

## Feature flags + AI provider

[`config/features.json`](config/features.json) — see [`../docs/FEATURE_FLAGS.md`](../docs/FEATURE_FLAGS.md).

- Set `"DOCUMENT_UPLOAD_ENABLED": false` to hide upload UI and block ingest API.
- Set `"ai_provider": "gemini"` (or `groq`, `openai`, `anthropic`) and add the matching API key in `.env`.

Live config: `GET /api/v1/config/features`

**Note:** Vector embeddings still use OpenAI when `OPENAI_API_KEY` is set; otherwise a dev hash fallback is used (1536-dim pgvector schema).
