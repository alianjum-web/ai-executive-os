# Backend (FastAPI)

Python API, LangGraph agents, Celery workers, Alembic migrations.

## Shared documentation (repo root)

Do not duplicate these under `backend/` — they apply to frontend and backend together:

| Document | Path |
|----------|------|
| Engineering master | [`../docs/PROJECT_MASTER.md`](../docs/PROJECT_MASTER.md) |
| Environment variables | [`../docs/ENVIRONMENT_VARIABLES.md`](../docs/ENVIRONMENT_VARIABLES.md) |
| Security audit | [`../docs/SECURITY_AUDIT.md`](../docs/SECURITY_AUDIT.md) |
| Docs index | [`../docs/README.md`](../docs/README.md) |

## Local run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

Config is loaded from env — see [`../docker/.env.example`](../docker/.env.example).
