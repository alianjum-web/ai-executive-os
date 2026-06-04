# Frontend — AI Executive OS

Next.js 16 web app for the monorepo: Supabase authentication, RAG chat (SSE streaming), document library, command-center dashboard, tickets, and feature-flagged analytics.

**Monorepo hub:** [`../README.md`](../README.md) (read first for full-stack context)  
**Dev vs production env:** [`../docs/DEV_VS_PRODUCTION.md`](../docs/DEV_VS_PRODUCTION.md)  
**Environment variables:** [`../docs/ENVIRONMENT_VARIABLES.md`](../docs/ENVIRONMENT_VARIABLES.md) · [`../docs/ENV_QUICK_START.md`](../docs/ENV_QUICK_START.md)

---

## What this app does

| Area | Route / module | Description |
|------|----------------|-------------|
| **Auth** | `/login`, `/signup` | Supabase email/password; session synced to API via Bearer JWT |
| **Chat** | `/chat` | Streaming answers with citations (`POST /api/v1/query/stream`) |
| **Knowledge** | `/knowledge` | Upload and list documents (ingest → Celery on backend) |
| **Dashboard** | `/dashboard` | Command center, metrics, quick actions |
| **Tickets** | `/tickets` | Project-agent ticket feed (feature-flagged) |
| **Welcome** | `/` | Marketing / landing when unauthenticated |

The frontend talks to the FastAPI backend at `NEXT_PUBLIC_API_URL`. Auth tokens come from Supabase; the backend verifies JWTs and syncs org/user rows in Postgres.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|--------|
| **Node.js** | 18+ | Required for `npm` scripts |
| **Backend** | running on `:8000` | Start with [`../backend/README.md`](../backend/README.md) or repo-root `npm run dev` |
| **Supabase project** | — | Same project as backend `SUPABASE_URL` |

---

## Environment files

Two files — do not commit them (gitignored):

| File | Used by | Purpose |
|------|---------|---------|
| `.env.dev` | `npm run dev` | Local development (Docker Postgres backend, localhost API) |
| `.env.production` | `npm run prod` | Production-like test on your laptop (remote Supabase DB, pooler, prod keys) |

Copy the template once:

```bash
cp .env.example .env.dev
# Optional, for prod-mode testing:
cp .env.example .env.production
```

### Minimum `.env.dev`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key from Supabase dashboard>
```

Use the **project root URL** for Supabase (`https://<ref>.supabase.co`) — not the Data API path `/rest/v1/`.

---

## First time only (new contributor)

Run from the **repo root** for the smoothest path (installs backend + frontend together):

```bash
git clone <repo-url> ai-executive-os
cd ai-executive-os

npm install
npm run setup

cp backend/.env.example backend/.env.dev
cp frontend/.env.example frontend/.env.dev
# Edit both files — same Supabase project, keys from dashboard

cd backend && npm run bootstrap && cd ..
```

`bootstrap` (backend) starts Docker Postgres, creates the Python venv, runs migrations on **local** `:5433`.

**Frontend-only** (if backend is already set up elsewhere):

```bash
cd frontend
cp .env.example .env.dev
# Edit .env.dev
npm install
```

---

## Every day — local development

### One command (recommended)

From **repo root** — starts backend (API + Celery + Docker deps) **and** frontend:

```bash
npm run dev
```

Uses `frontend/.env.dev` and `backend/.env.dev`.

### One command (this folder only)

```bash
cd frontend
npm run dev
```

Loads `.env.dev` and runs Next.js on **http://localhost:3000**.  
Backend must already be up (`cd backend && npm run dev` or root `npm run dev`).

---

## Test production-like behavior (on your laptop)

Uses remote Supabase database and production env files (no local Docker Postgres for the API).

### One command (repo root)

```bash
npm run prod
```

Uses `frontend/.env.production` and `backend/.env.production`.

### One command (this folder only)

```bash
cd frontend
npm run prod
```

Fill `.env.production` first (see [`../docs/SUPABASE_REMOTE_DATABASE.md`](../docs/SUPABASE_REMOTE_DATABASE.md)).  
Typical test URL: still **http://localhost:3000** with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` while the backend runs locally against the remote DB.

### Production build (deploy-style check)

```bash
npm run build:prod    # uses .env.production
npm run start:prod
```

---

## How to verify it works

| Step | Check |
|------|--------|
| 1 | `npm run dev` → http://localhost:3000 loads |
| 2 | Sign in / sign up (Supabase) |
| 3 | Open **Chat** — message streams (backend :8000 + valid LLM key) |
| 4 | Open **Knowledge** — upload if `DOCUMENT_UPLOAD_ENABLED` in backend features |

```bash
curl -s http://127.0.0.1:8000/api/v1/health
```

---

## npm scripts

| Command | When to use |
|---------|-------------|
| `npm install` | First time in `frontend/` |
| `npm run dev` | Daily — dev UI with `.env.dev` |
| `npm run prod` | Daily — prod-like UI with `.env.production` |
| `npm run build` | Production build (`.env.dev`) |
| `npm run build:prod` | Production build (`.env.production`) |
| `npm run start` / `start:prod` | Serve built app |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright |

---

## Project structure

```text
frontend/
├── src/
│   ├── app/              # Next.js App Router — routes only (thin pages)
│   ├── proxy.ts          # Request gate: session, login ↔ app redirects
│   ├── auth/             # Login, signup, AuthProvider, auth services
│   ├── chat/             # Chat UI, SSE hook, citations
│   ├── dashboard/        # Command center, metrics charts
│   ├── knowledge/        # Document library + upload
│   ├── tickets/          # Ticket feed + hooks
│   ├── welcome/          # Landing / marketing
│   └── common/           # Shared atoms, layout, Redux, API + Supabase clients
├── public/
├── .env.example          # Template → copy to .env.dev / .env.production
├── eslint.config.mjs
├── jest.config.js
└── package.json
```

### Feature modules (atomic design)

Each feature folder under `src/` follows the same layers:

| Layer | Role | Examples |
|-------|------|----------|
| `atoms/` | Smallest UI | `Button`, shadcn `ui/*` |
| `molecules/` | Composed pieces | `ChatBubble`, `ErrorState` |
| `organisms/` | Page sections | `ChatWindow`, `AppShell` |
| `screens/` | Full page composition | `ChatScreen`, `LoginScreen` |
| `hooks/` | Data + Redux adapters | `useChat`, `useTickets` |
| `state/` | Redux slices | `chatSlice` |
| `services/` | Module-specific API (optional) | `auth/services/` |

**`common/`** holds anything shared across two or more features: layout shell, theme, feature flags, Supabase client, API client, root Redux store.

Deeper layout notes: [`src/README.md`](src/README.md) · [`src/common/README.md`](src/common/README.md)

### Core files (start debugging here)

| File | Role |
|------|------|
| [`src/proxy.ts`](src/proxy.ts) | Next.js 16 edge gate — protected routes, auth redirects |
| [`src/auth/organisms/AuthProvider.tsx`](src/auth/organisms/AuthProvider.tsx) | Supabase session in React |
| [`src/auth/services/auth.service.ts`](src/auth/services/auth.service.ts) | Login/signup/logout; Bearer token for API |
| [`src/common/services/supabase/client.ts`](src/common/services/supabase/client.ts) | Browser Supabase client |
| [`src/common/services/api/client.ts`](src/common/services/api/client.ts) | Typed fetch to FastAPI |
| [`src/app/layout.tsx`](src/app/layout.tsx) | Root layout, providers, theme |

Full three-file map (frontend + backend): [`../docs/CORE_FILES.md`](../docs/CORE_FILES.md)

---

## Tech stack

- **Next.js 16** (App Router, `proxy.ts` for auth routing)
- **React 19**
- **Redux Toolkit** — global UI/user/org state; feature slices in modules
- **Supabase SSR** (`@supabase/ssr`) — cookies + session refresh
- **Tailwind CSS 4** + shadcn-style components under `common/atoms/ui/`
- **Recharts** — analytics dashboard

---

## Tests and quality

```bash
npm run lint
npm test
npm run test:e2e   # requires app running; see playwright config
```

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [`../README.md`](../README.md) | Monorepo onboarding, cheat sheet, troubleshooting |
| [`../backend/README.md`](../backend/README.md) | API, Celery, Docker, migrations |
| [`../docs/PROJECT_MASTER.md`](../docs/PROJECT_MASTER.md) | Engineering spec and conventions |
| [`../docs/CORE_FILES.md`](../docs/CORE_FILES.md) | Where auth, RAG, and tenant sync live |
| [`../docs/FEATURE_FLAGS.md`](../docs/FEATURE_FLAGS.md) | Flags served from backend `config/features.json` |

---

## Quick reference

| Goal | Command |
|------|---------|
| **First time (full stack)** | Root: `npm install && npm run setup` → copy env files → `cd backend && npm run bootstrap` |
| **Daily dev (full stack)** | Root: `npm run dev` |
| **Daily dev (frontend only)** | `cd frontend && npm run dev` |
| **Prod-like test (full stack)** | Root: `npm run prod` |
| **Prod-like test (frontend only)** | `cd frontend && npm run prod` |
