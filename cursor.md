# AI Executive OS — Cursor Rules

## Project: AI-Powered Executive Operating System & SOP Automator

Global context for Cursor AI on every code generation request.  
Human-readable copy: [docs/CURSOR_RULES.md](docs/CURSOR_RULES.md).

---

## Architecture Rules (NEVER VIOLATE)

- Frontend uses Atomic Design: `atoms/` → `molecules/` → `organisms/` → `templates/`.
- Atoms are stateless. Molecules have local state only. Organisms use **hooks** for data.
- **Redux Toolkit** for global client state — never import `store/` in components; use `useSidebar`, `useChat`, `useUser`, `useOrg`, `useTickets`, `useDocumentUpload`, etc.
- Backend uses layered architecture: **router → service → database / agents**.
- Routers NEVER contain business logic. Services NEVER import FastAPI `Request`/`Response` (except auth/rate-limit).
- LangGraph agents are ALWAYS deterministic state machines with explicit named nodes.
- Every new feature MUST be gated by a feature flag in `frontend/src/config/features.config.ts` and `backend/app/core/feature_flags.py` (`FEATURE_*` env).
- Database queries always filter by `org_id` for multi-tenant isolation.

---

## Tech Stack (Use ONLY These)

- **Frontend:** Next.js **16** (App Router), TypeScript, Tailwind CSS, Redux Toolkit + hooks, Recharts
- **Auth:** Supabase Auth (email/password) — **not** NextAuth, **not** Zustand
- **Backend:** Python 3.11+, FastAPI, LangGraph, LangChain, SQLAlchemy 2.0 (async)
- **Database:** PostgreSQL 16 + pgvector. ORM: SQLAlchemy. Migrations: Alembic
- **LLM:** OpenAI GPT-4o for generation, **gpt-4o-mini** for grading, **text-embedding-3-small** for embeddings
- **Rerank:** Cohere Rerank API (fallback: score sort)
- **Queue:** Celery + Redis. Never process files synchronously in route handlers
- **Integrations:** Slack webhooks, SendGrid email, Jira REST v3 (tokens in DB via Settings UI, Fernet-encrypted)

---

## RAG Pipelines

**Ingestion:** upload → Celery → PyMuPDF/python-docx extract → LangChain chunk (≤800 tokens) → batch embed → pgvector → `ready`.

**Query:** embed → pgvector top-10 → Cohere rerank top-5 → gpt-4o-mini grade (≥3) → gpt-4o + `[1]` citations → SSE stream → `QueryLog`.

---

## Code Style Rules

- All Python files: Black formatted, type hints on all function signatures.
- All TypeScript files: strict mode enabled, no `any` types.
- All API endpoints use Pydantic schemas for request AND response validation.
- Docstrings on non-obvious service methods only.
- Database queries always filter by `org_id` for multi-tenant isolation.

---

## Testing Rules

- Every new service method needs at minimum 3 pytest tests (happy, empty, error).
- Every new Atom/Molecule needs React Testing Library tests when behavior is non-trivial.
- Use AsyncMock for mocking async services in tests.
- Never use `time.sleep()` in tests — use pytest-asyncio properly.

---

## Security Rules

- NEVER log API keys, user passwords, or JWT tokens.
- All user inputs sanitized before DB insert (Pydantic validation).
- Webhook endpoints validate signatures before any processing.
- API keys stored in database must be Fernet-encrypted (`ENCRYPTION_KEY`).
- Rate limits: 60 queries/min per user, 10 uploads/hour per org.

---

## Documentation

| Topic | Path |
|-------|------|
| Env vars §9 | `docs/ENVIRONMENT_VARIABLES.md` |
| Docs index | `docs/README.md` |
| Product master | `docs/PROJECT_MASTER.md` |
| Docker env | `docker/.env.example` |

---

## Before Implementing

1. Read `docs/PROJECT_MASTER.md` §1 (current progress).
2. Use env names from `docs/ENVIRONMENT_VARIABLES.md` only — do not invent variables.
3. Gate UI behind feature flags; match existing hooks and patterns.
