# Environment files — quick start

Use **example** files (safe to commit). Copy to the **active** file name (gitignored), then add your secrets.

## Which file you need

| How you run the app | Backend active file | Frontend active file |
|---------------------|---------------------|----------------------|
| **Local (recommended)** — `uvicorn` + `npm run dev` | `backend/.env` ← from `backend/.env.local.example` | `frontend/.env.local` ← from `frontend/.env.local.example` |
| **Local — all Docker** | `docker/.env` ← from `docker/.env.local.example` | (frontend vars are inside `docker/.env`) |
| **Production — Docker** | `docker/.env` ← from `docker/.env.production.example` | same `docker/.env` |
| **Production — split deploy** | `backend/.env` ← from `backend/.env.production.example` | `frontend/.env.production` ← from `frontend/.env.production.example` |

## Setup commands (local, no Docker)

```bash
# Backend
cd backend
cp .env.local.example .env
# Edit .env: GEMINI_API_KEY, ENCRYPTION_KEY, DATABASE_URL, REDIS_URL

# Frontend
cd ../frontend
cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Minimum values to fill (local)

### `backend/.env`

| Variable | Required? |
|----------|-----------|
| `DATABASE_URL` | Yes |
| `REDIS_URL` | Yes |
| `ENCRYPTION_KEY` | Yes (Fernet) |
| `GEMINI_API_KEY` | Yes if `ai_provider` is `gemini` in `config/features.json` |
| `CORS_ORIGINS` | Yes (`http://localhost:3000`) |

### `frontend/.env.local`

| Variable | Required? |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |

## AI provider

Set `"ai_provider"` in `backend/config/features.json` (`gemini`, `groq`, `openai`, `anthropic`) and add the matching API key in `backend/.env`.

## All templates in the repo

| Template | Purpose |
|----------|---------|
| `backend/.env.local.example` | Backend local |
| `backend/.env.production.example` | Backend production |
| `frontend/.env.local.example` | Frontend local |
| `frontend/.env.production.example` | Frontend production build |
| `docker/.env.local.example` | Full stack local Docker |
| `docker/.env.production.example` | Full stack production Docker |

See also: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
