# Documentation (repository root)

**All shared docs for this monorepo live here.**  
Frontend and backend both link here — we do **not** copy the same tables into `frontend/docs/` and `backend/`.

## Why root `docs/`?

| Approach | Verdict |
|----------|---------|
| `docs/` at repo root | **Chosen** — env vars, security, and master guide apply to both apps |
| `frontend/docs/` + `backend/docs/` with duplicates | Avoid — two sources of truth drift apart |
| Env vars only in `backend/` | Wrong — `NEXT_PUBLIC_*` are frontend |

## Documents

| File | Audience | Description |
|------|----------|-------------|
| [PROJECT_MASTER.md](./PROJECT_MASTER.md) | Everyone | Product vision, sprints, RAG §8, schema, LangGraph |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | DevOps / devs | §9 env reference (PDF + as implemented) |
| [CURSOR_RULES.md](./CURSOR_RULES.md) | Cursor / AI | §10 rules (mirror of root `cursor.md`) |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Release | Sprint 5 security checklist |

## Also at repo root

| File | Notes |
|------|--------|
| [`../cursor.md`](../cursor.md) | **Required** for Cursor IDE (not inside `docs/`) |
| [`../docker/.env.example`](../docker/.env.example) | Docker Compose env template |
| [`../frontend/.env.example`](../frontend/.env.example) | Frontend-only `NEXT_PUBLIC_*` |
| [`../README.md`](../README.md) | Quick start & architecture |

## Package READMEs (pointers only)

- [`../frontend/README.md`](../frontend/README.md) — how to run Next.js
- [`../backend/README.md`](../backend/README.md) — how to run FastAPI/Celery  
- [`../frontend/docs/README.md`](../frontend/docs/README.md) — redirect stub (no duplicate content)
