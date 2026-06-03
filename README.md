# AI Executive OS & SOP Automator

Monorepo for the AI-Powered Executive Operating System.

## Structure

| Path | Description |
|------|-------------|
| `frontend/` | Next.js 16, Supabase Auth, Redux, Recharts analytics, SSE chat |
| `backend/` | FastAPI, LangGraph RAG (grade + rerank), Celery, pgvector |
| `docker/` | Docker Compose — full local stack |
| `frontend/docs/PROJECT_MASTER.md` | Engineering master documentation |

## Quick start (Docker)

```bash
cp docker/.env.example docker/.env
# Set OPENAI_API_KEY, COHERE_API_KEY (optional), Supabase keys

cd docker
docker compose up --build
```

- Frontend: http://localhost:3000  
- API health: http://localhost:8000/api/v1/health  
- **OpenAPI docs:** http://localhost:8000/docs  

## API reference (Sprint 2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/health` | — | Health check |
| `POST` | `/api/v1/ingest` | Admin | Upload PDF/DOCX/MD → 202 + Celery job |
| `GET` | `/api/v1/documents` | User | List documents (org-scoped) |
| `DELETE` | `/api/v1/documents/{id}` | Admin | Delete document + chunks/embeddings |
| `POST` | `/api/v1/query` | User | RAG answer + citations |
| `POST` | `/api/v1/query/stream` | User | SSE token stream + final citations |
| `GET` | `/api/v1/analytics/dashboard` | Admin | Queries today, p50/p95 latency, top questions |

### Authentication

**Production:** `Authorization: Bearer <supabase_jwt>` with JWT claims:

```json
{
  "user_metadata": {
    "org_id": "uuid",
    "role": "admin"
  }
}
```

**Local dev (no JWT secret):** headers `X-Org-Id`, `X-User-Id`, `X-User-Role` (`admin` | `employee`).

### Streaming format (`/query/stream`)

Server-Sent Events (`text/event-stream`):

```
data: {"type":"token","content":"Hello"}

data: {"type":"done","answer":"...","citations":[...],"latency_ms":120}
```

## Local development

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
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

1. Create a project at [supabase.com](https://supabase.com)  
2. Enable Email auth  
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `frontend/.env.local`  
4. Optional: set `SUPABASE_JWT_SECRET` in backend for verified JWTs  
5. On sign-up, users provide `org_id` / `org_name` in metadata (see login page)

## Tests

```bash
cd backend && pytest          # unit + integration (Sprint 1 & 2)
cd frontend && npm test       # Jest (atoms, CitationCard)
cd frontend && npm run test:e2e # Playwright (set E2E_RUN_LIVE=1 for live stack)
```

## Slack setup (Sprint 3)

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)  
2. Enable **Event Subscriptions** → Request URL: `https://<your-api>/api/v1/webhook/slack`  
3. Subscribe to `message.channels` (or `message.groups` / `message.im` as needed)  
4. Copy **Signing Secret** → `SLACK_SIGNING_SECRET`  
5. Add Bot Token Scopes: `chat:write`, `im:write` → install app → `SLACK_BOT_TOKEN`  
6. Set `DEFAULT_ORG_ID` to your Supabase `user_metadata.org_id` for webhook routing  

## Feature flags (Sprint 2–3)

| Flag | Default |
|------|---------|
| `KNOWLEDGE_AGENT_ENABLED` | true |
| `DOCUMENT_UPLOAD_ENABLED` | true |
| `BASIC_AUTH_ENABLED` | true |
| `MULTI_TENANT_ENABLED` | true |
| `ANALYTICS_DASHBOARD_ENABLED` | true (admin dashboard) |
| `PROJECT_AGENT_ENABLED` | true |
| `SLACK_WEBHOOK_ENABLED` | true |

## API — Sprint 3

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/webhook/slack` | Slack Events API (HMAC verified) |
| `GET` | `/api/v1/tickets` | Org-scoped ticket feed |

## RAG pipeline (Sprint 2)

1. Vector retrieve (top 10, org-filtered)  
2. LLM relevance grade 1–5 (drop ≤2)  
3. Cohere Rerank (fallback: grade/score sort)  
4. GPT-4o answer + citation cards (chunk_id, full chunk_text, page)
