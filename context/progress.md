# Project progress

Track major initiatives and migration status. Update this file when shipping spec work.

---

## Supabase native migration — **Done** (2026-06-08)

**Spec:** [`specs/01-supabase-native-migration.md`](specs/01-supabase-native-migration.md)

| Step | Status | Notes |
|------|--------|-------|
| Convert Alembic 001–006 → Supabase SQL | ✅ | `supabase/migrations/20260603000001` … `000006` |
| Add RLS policies (all tables) | ✅ | `20260603000007_row_level_security.sql` |
| FK indexes on referencing columns | ✅ | Included in migration files |
| Decommission Alembic | ✅ | Removed `backend/alembic/`, `alembic.ini`, dep from `requirements.txt` |
| `npm run db:migrate` → Supabase CLI | ✅ | `backend/scripts/db_push.sh` |
| CI/CD migration jobs | ✅ | `supabase db push` in `.github/workflows/ci.yml` + `cd.yml` |
| Backend design patterns doc | ✅ | [`code-desing-patterns.md`](code-desing-patterns.md) |
| `backend/AGENTS.md` pointer | ✅ | Agents must read design patterns before coding |

### Your next steps (manual)

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   # or: npx supabase --version
   ```
2. **Fix local `.env.dev`** — use Docker Postgres for daily dev:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/sop_automator
   ```
3. **Existing Alembic DB?** Mark migrations applied (do not re-run DDL):
   ```bash
   cd supabase
   DB_URL="postgresql://postgres:postgres@127.0.0.1:5433/sop_automator"
   for v in 20260603000001 20260603000002 20260603000003 \
            20260603000004 20260603000005 20260603000006 20260603000007; do
     supabase migration repair "$v" --status applied --db-url "$DB_URL"
   done
   ```
4. **Fresh DB?** Apply all migrations:
   ```bash
   cd backend && npm run db:migrate
   ```
5. **Verify:**
   ```bash
   cd backend && npm run db:migration:list
   supabase migration list --db-url "postgresql://..."
   ```

### Error resolved

`relation "supabase_migrations.schema_migrations" does not exist` — fixed by running `supabase db push`, which initializes the tracking schema automatically.

---

## CI/CD pipeline — **Done** (prior session)

- GitHub Actions CI on PRs
- CD on push to `main` (GHCR + optional Vercel / prod migrations)
- Docs: [`docs/CI_CD.md`](../docs/CI_CD.md)

---

## Upcoming / not started

| Item | Priority | Notes |
|------|----------|-------|
| Wire Celery beat for connector sync cron | Medium | Task exists; needs deploy schedule |
| Document-level RBAC in vector retrieval (L3) | Medium | Schema ready; filter in `vector_service` |
| SSO / SCIM | Low | Enterprise tier |

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-08 | Supabase CLI replaces Alembic | Single migration source; RLS-native; aligns with Supabase auth stack |
| 2026-06-08 | Backend design patterns in `context/` | Prevent AI/human drift across sessions |
