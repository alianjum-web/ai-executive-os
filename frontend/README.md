# Frontend (Next.js)

Web UI: Supabase auth, RAG chat (SSE), document upload, analytics.

**Complete setup:** [`../README.md`](../README.md) · **Dev vs production checks:** [`../docs/DEV_VS_PRODUCTION.md`](../docs/DEV_VS_PRODUCTION.md)

## First time only

```bash
cd frontend
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
```

Backend must be running — see [`../backend/README.md`](../backend/README.md).

## Every dev session

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## Check development

1. `npm run dev` → http://localhost:3000 loads  
2. Sign in (Supabase)  
3. Chat sends a message (backend must be on :8000)

## Check production (laptop)

```bash
cp .env.production.example .env.production   # first time, fill values
npm run build
npm run start
```

Use `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` when testing against a local backend. Full steps: [`../docs/DEV_VS_PRODUCTION.md`](../docs/DEV_VS_PRODUCTION.md).

## Scripts

| Command | When |
|---------|------|
| `npm install` | First time |
| `npm run dev` | Daily — development UI (:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Jest |
| `npm run test:e2e` | Playwright |

## Docs

- [docs/PROJECT_MASTER.md](./docs/PROJECT_MASTER.md) — frontend architecture and conventions
- [../docs/ENV_QUICK_START.md](../docs/ENV_QUICK_START.md) — environment variables
