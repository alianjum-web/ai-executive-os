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

Config is loaded from `backend/.env` — copy from [`.env.local.example`](.env.local.example) or [`.env.production.example`](.env.production.example). See [`../docs/ENV_QUICK_START.md`](../docs/ENV_QUICK_START.md).

### Feature flags + AI provider

One file: [`config/features.json`](config/features.json) — see [`../docs/FEATURE_FLAGS.md`](../docs/FEATURE_FLAGS.md).

- Set `"DOCUMENT_UPLOAD_ENABLED": false` to hide upload UI and block ingest API.
- Set `"ai_provider": "gemini"` (or `groq`, `openai`, `anthropic`) and add the matching API key in `.env`.

Live config: `GET /api/v1/config/features`

**Note:** Vector embeddings still use OpenAI when `OPENAI_API_KEY` is set; otherwise a dev hash fallback is used (1536-dim pgvector schema). For production RAG quality, use OpenAI embeddings or keep a free OpenAI tier for ingest only.
