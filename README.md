# AI Executive OS & SOP Automator

Monorepo for the AI-Powered Executive Operating System (Sprint 1: Knowledge Agent MVP).

## Structure

| Path | Description |
|------|-------------|
| `frontend/` | Next.js 16 dashboard, Supabase Auth, Redux, chat & upload UI |
| `backend/` | FastAPI, LangGraph RAG, Celery, pgvector |
| `docker/` | Docker Compose — full local stack |
| `frontend/docs/PROJECT_MASTER.md` | Engineering master documentation |

## Quick start (Docker)

```bash
cp docker/.env.example docker/.env
# Add OPENAI_API_KEY and Supabase keys to docker/.env

cd docker
docker compose up --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:8000/api/v1/health  
- Docs: upload at `/knowledge`, chat at `/chat`

## Local development (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
# In another terminal:
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Auth (Supabase)

Sprint 1 uses **Supabase Auth** (email/password) — aligned with PostgreSQL and scalable RBAC.

1. Create a project at [supabase.com](https://supabase.com)
2. Enable Email provider under Authentication
3. Copy URL + anon key into `frontend/.env.local`

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```

## Sprint 1 feature flags

- `KNOWLEDGE_AGENT_ENABLED`: true  
- `DOCUMENT_UPLOAD_ENABLED`: true  
- `BASIC_AUTH_ENABLED`: true  
