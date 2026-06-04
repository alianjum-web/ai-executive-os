# AI-Powered Executive Operating System & Internal SOP Automator

**Engineering Master Documentation**

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Status | Active Development |
| Prepared For | Engineering Team |
| Repo | `internal-sop-automator` |
| Last Updated | 2026-06-03 |

> **CONFIDENTIAL** — Internal Engineering. Not for distribution.

This document is the single source of truth for product vision, architecture, conventions, sprint plan, and how we are proceeding. Agents and developers should read this before implementing features.

---

## Table of Contents

1. [Current Progress](#1-current-progress)
2. [Executive Summary & Product Vision](#2-executive-summary--product-vision)
3. [System Architecture & Tech Stack](#3-system-architecture--tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Design Patterns & Standards](#5-design-patterns--standards)
6. [Redux State Management (Team Decision)](#6-redux-state-management-team-decision)
7. [Feature Flag System](#7-feature-flag-system)
8. [Testing Strategy](#8-testing-strategy)
9. [Sprint Plan](#9-sprint-plan)
10. [Database Schema](#10-database-schema)
11. [LangGraph Agent Flows](#11-langgraph-agent-flows)
12. [Appendix: Quick Reference for Agents](#appendix-quick-reference-for-agents)

---

## 1. Current Progress

Use this section to track where we are. Update it as sprints complete.

### 1.1 What Exists Today

| Area | Status | Notes |
|------|--------|-------|
| Monorepo layout | Done | `frontend/`, `backend/`, `docker/` |
| Frontend | Done | Next.js 16, Redux + hooks, atomic components, dashboard/knowledge/chat |
| Backend | Done | FastAPI ingest/query, LangGraph Knowledge Agent, Celery worker |
| PostgreSQL + pgvector | Done | Docker + Alembic migration `001` |
| Redux Toolkit | Done | Slices behind `useSidebar`, `useChat`, `useUser` hooks |
| Feature flags | Done | `src/common/config/features.config.ts` + backend flags |
| Auth | Done | **Supabase Auth** (email/password) — see `frontend/.env.example` |
| Knowledge Agent (RAG) | Done | MVP: upload → embed → query with citations |
| Project Agent (routing) | Not started | Sprint 3+ |

### 1.2 Active Sprint

**Sprint 3 — Project Agent & Slack** — Complete

- [x] `POST /api/v1/webhook/slack` with HMAC-SHA256 + url_verification
- [x] LangGraph Project Agent (classify → priority → assign → ticket → Slack DM)
- [x] Assignee mapping + round-robin by department
- [x] Tickets API + `/tickets` UI (TicketRow, TicketFeed, 5s polling)
- [x] `PROJECT_AGENT_ENABLED` + `SLACK_WEBHOOK_ENABLED` flags enabled

**Sprint 2 — RAG Quality, Multi-Tenancy & Dashboard** — Complete

- [x] LangGraph relevance grading (drop chunks graded ≤2)
- [x] Cohere Rerank API (+ heuristic fallback)
- [x] Citation cards with full chunk text, document name, page
- [x] Organizations + org_id isolation on all queries
- [x] Admin analytics dashboard (Recharts)
- [x] Query logging with cited_chunk_ids + latency_ms
- [x] RBAC: admin upload/metrics, employee chat-only
- [x] Document DELETE with cascade
- [x] SSE token streaming (`/query/stream` + `useQueryStream`)
- [x] OpenAPI at `/docs` + README API section

**Sprint 1 — Foundation & MVP Knowledge Agent** — Complete

### 1.3 Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-03 | **Redux Toolkit** for global client state | Explicit team choice; hook adapter layer keeps components decoupled from store implementation |
| 2026-06-03 | Next.js 16 (not 14) | Scaffolded with latest `create-next-app` |
| 2026-06-03 | pgvector in PostgreSQL for MVP | No separate vector DB (Pinecone/Weaviate) in MVP |
| 2026-06-03 | **Supabase Auth** (not NextAuth) | Same Postgres ecosystem, built-in email/password, SSR helpers for Next.js |

---

## 2. Executive Summary & Product Vision

### What We Are Building

A two-agent internal operations platform:

1. **Knowledge Agent (RAG)** — Ingests company SOPs, handbooks, and PDFs. Employees ask questions in plain English; answers include exact document citations (minimize hallucination).
2. **Project Agent (Event Router)** — Monitors Slack and email via webhooks. Parses intent and priority, creates structured Jira/Linear tickets, assigns to the correct owner.

Together: an enterprise workspace that reduces operational cost, eliminates manual ticket routing, and gives employees citation-accurate answers from internal documents.

### Core Problems We Solve

1. **Knowledge discovery** — 20–30 minutes per query digging through Google Docs, Notion, or outdated PDFs.
2. **Manual ticket routing** — Support/HR managers spend 2–4 hours daily categorizing and assigning tickets.
3. **Slow onboarding** — Authoritative knowledge is fragmented and hard to find in real time.

### Business Value & ROI

| Value Driver | Metric | Benefit |
|--------------|--------|---------|
| HR/Support cost reduction | 60–70% of tier-1 queries automated | Avoid extra support headcount |
| Ticket routing speed | Manual 2–4 hr → automated under 1 sec | Teams unblock instantly |
| Onboarding velocity | Self-serve from day one | Faster time to productivity |
| Compliance & accuracy | Every answer cites source | Lower misinformation risk |

---

## 3. System Architecture & Tech Stack

### 3.1 High-Level Architecture (Three Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — Frontend: Command Workspace (Next.js)            │
│  Dashboard, knowledge upload, chat UI, tickets, settings    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│  LAYER 2 — Backend: FastAPI + LangGraph + LangChain         │
│  Ingest, RAG query, webhooks, Jira/Slack integrations       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  LAYER 3 — Data: PostgreSQL 16 + pgvector + object storage  │
│  Users, docs, embeddings, tickets, audit logs               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack Reference

| Category | Technology | Version / Notes |
|----------|------------|-----------------|
| Frontend | Next.js (App Router) | **16.x** in repo (master doc referenced 14) |
| Language (FE) | TypeScript | 5.x |
| UI | Shadcn/UI + Tailwind CSS | To install |
| Global state | **Redux Toolkit** | Team decision — see §6 |
| Server state | Custom hooks + API client | Not in Redux |
| Backend | FastAPI | 0.104+ |
| Language (BE) | Python | 3.11+ |
| Agents | LangGraph + LangChain | Deterministic state machines |
| LLM | OpenAI GPT-4o | Enterprise RAG |
| Embeddings | OpenAI `text-embedding-3-small` | 1536 dimensions |
| Database | PostgreSQL 16 + pgvector | Cosine similarity in SQL |
| File storage | Supabase Storage or S3 | — |
| Auth | NextAuth.js or Supabase Auth | — |
| Task queue | Celery + Redis | Background doc processing |
| Containers | Docker + Docker Compose | Local dev parity |
| CI/CD | GitHub Actions | Tests on every PR |
| Deploy | Vercel (FE) + Railway/Render (BE) | MVP |
| Monitoring | Sentry + Logfire | — |

### 3.3 Key Frontend Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Metrics |
| `/knowledge` | Document upload & status |
| `/chat` | Knowledge Agent Q&A UI |
| `/tickets` | Routing log |
| `/settings` | API keys, webhooks |
| `(auth)/login` | Authentication |

### 3.4 Key Backend API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/ingest` | Document upload & processing |
| `POST /api/v1/query` | RAG search |
| `POST /api/v1/webhook/slack` | Slack events |
| `POST /api/v1/webhook/email` | Inbound email |
| `GET /api/v1/tickets` | Ticket list |
| `GET /api/v1/health` | Health check |

---

## 4. Folder Structure

**Principle:** Every folder has one clear responsibility. If you cannot describe it in five words, split or rename it.

### 4.1 Frontend (`/frontend` or repo root `src/`)

Target layout (adapt as we scaffold):

```
src/
  app/                          # Next.js routes only (thin pages → module screens)
  common/                       # Shared atoms→organisms, hooks, state, store, services, lib/, config/
  auth/ | chat/ | dashboard/ | knowledge/ | tickets/ | welcome/
    atoms/ | molecules/ | organisms/ | screens/ | hooks/ | state/
    services/                   # e.g. auth/services; API/Supabase in common/services/
```

> **Note:** Original master doc listed `stores/` with Zustand. We use `store/` + Redux slices instead. Components never import from `store/` directly.

### 4.2 Backend (`/backend`)

```
app/
  main.py
  api/v1/routers/
    ingest.py | query.py | webhooks.py | tickets.py | health.py
  agents/
    knowledge_agent.py | project_agent.py | base_agent.py
  services/
    document_service.py | embedding_service.py | vector_service.py
    llm_service.py | ticket_service.py | notification_service.py
  models/
    database.py | schemas.py
  core/
    config.py | database.py | security.py | feature_flags.py
  tasks/
    celery_app.py | document_tasks.py
tests/
  unit/ | integration/ | e2e/
alembic/
docker/
```

### 4.3 Backend Layer Rules

| Layer | Responsibility | Must NOT |
|-------|----------------|----------|
| Router | HTTP, Pydantic validation, call service | Business logic, direct DB |
| Service | Business logic, LLM, external APIs | HTTP Request/Response |
| Data / Repository | SQLAlchemy, queries | Business logic, external APIs |
| Agent | LangGraph state machines | Be called directly from routers |
| Schema | Pydantic I/O models | Confused with ORM models |

---

## 5. Design Patterns & Standards

### 5.1 Frontend: Atomic Design (Mandatory)

| Level | Definition | Examples | Rule |
|-------|------------|----------|------|
| **Atom** | Single-purpose, stateless | Button, Input, Badge | Props only; no business logic |
| **Molecule** | 2+ atoms, micro-interaction | SearchBar, ChatBubble | Local UI state OK |
| **Organism** | Full section, uses hooks | ChatWindow, SidebarNav | Data via hooks only |
| **Template** | Page shell, no data | DashboardTemplate | Wires organisms |
| **Page** | `page.tsx` | `chat/page.tsx` | Initial data, renders template |

**Enforcement (code review rejects):**

- Atom imports from `molecules/` → **WRONG**
- Organism calls `fetch()` directly → **WRONG** (use hooks)
- Molecule contains business logic (roles, pricing) → **WRONG** (move to hook/service)

### 5.2 Custom Hooks Pattern (Data Layer)

All server state lives in hooks. Components receive data and handlers.

```ts
// hooks/useKnowledgeQuery.ts — example shape
export const useKnowledgeQuery = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sendQuery = async (query: string) => { /* api.ts */ };
  return { messages, isLoading, sendQuery };
};
// ChatWindow organism calls useKnowledgeQuery() — never fetch() directly.
```

**Do not put server/async data in Redux** — use hooks (optionally SWR/React Query later). Redux is for global **client UI state** (sidebar, theme, notification queue, etc.).

### 5.3 Backend: LangGraph Agents

Agents are explicit `StateGraph` machines — not free-running ReAct loops.

**Error handling:** Failed nodes transition to explicit `[handle_error]` — never silently swallow with empty `try/except`.

---

## 6. Redux State Management (Team Decision)

The engineering master doc originally described Zustand with a migration path to Redux. **This project uses Redux Toolkit from the start.** The same architectural rules apply: components must never depend on the store implementation directly.

### 6.1 Layered State Architecture

```
Component → Custom Hook → Redux (slices + selectors)
```

### 6.2 Forbidden vs Allowed

```ts
// ❌ Forbidden in components/pages/organisms
import { useSelector } from 'react-redux';
const isOpen = useSelector((s) => s.ui.sidebarOpen);

// ✅ Allowed
const { isOpen, toggle } = useSidebar();
```

### 6.3 Feature Hooks (Public API for UI)

| Hook | Redux slice (internal) | Purpose |
|------|------------------------|---------|
| `useSidebar()` | `uiSlice` | Sidebar open, layout |
| `useChat()` | `chatSlice` | Client chat UI state |
| `useTickets()` | `ticketSlice` | Client ticket UI state |
| `useUser()` | `userSlice` | Session display state |
| `useNotifications()` | `uiSlice` (or dedicated slice) | Toast/queue |

Only these hooks are imported by React components under feature folders (`auth/`, `chat/`, …) and thin `app/` pages.

### 6.4 Slice Rules

Redux slices must:

- Contain state + reducers/actions only
- **Not** be imported in UI components (only in `hooks/`)
- **Not** contain API calls or business logic
- **Not** contain React-specific logic

API and transformations belong in `hooks/` or `lib/api.ts`.

### 6.5 Store Setup (planned)

```
store/
  index.ts          # configureStore, Provider wiring in layout
  hooks.ts          # useAppDispatch, useAppSelector (for hooks/ only)
  slices/
    uiSlice.ts
    chatSlice.ts
    ticketSlice.ts
    userSlice.ts
```

Wrap root layout:

```tsx
// app/layout.tsx — pattern
<Provider store={store}>{children}</Provider>
```

### 6.6 Core Principle

Treat Redux as an **internal implementation detail**. Components behave as if state management does not exist — they only consume clean hooks.

**Summary:** If a component imports from `store/` or uses `useSelector`/`useDispatch` directly, it violates architecture.

---

## 7. Feature Flag System

Implement from Sprint 1. Enables safe rollouts, instant rollback, per-org demos, and gradual rollout.

### 7.1 Frontend — `src/common/config/features.config.ts`

```ts
export const FEATURE_FLAGS = {
  // MVP (Sprint 1–2)
  KNOWLEDGE_AGENT_ENABLED: true,
  DOCUMENT_UPLOAD_ENABLED: true,
  BASIC_AUTH_ENABLED: true,

  // Sprint 3
  PROJECT_AGENT_ENABLED: false,
  SLACK_WEBHOOK_ENABLED: false,
  EMAIL_WEBHOOK_ENABLED: false,

  // Sprint 4
  JIRA_INTEGRATION_ENABLED: false,
  WORKLOAD_BALANCING_ENABLED: false,
  MULTI_TENANT_ENABLED: false,

  // Sprint 5
  ANALYTICS_DASHBOARD_ENABLED: false,
  AUDIT_LOG_ENABLED: false,
  CUSTOM_LLM_PROVIDER_ENABLED: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
```

### 7.2 Frontend — `useFeatureFlag`

```ts
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag];
};
```

### 7.3 Backend — `core/feature_flags.py`

Environment prefix `FEATURE_`. Return 404 when disabled (e.g. Slack webhook).

---

## 8. Testing Strategy

| Test Type | Tool | What to Test | Coverage Target |
|-----------|------|--------------|-----------------|
| Unit (FE) | Jest + RTL | Atoms, molecules | 90%+ atoms/molecules |
| Unit (BE) | pytest + pytest-asyncio | Services, agents (mocked) | 85%+ services/agents |
| Integration (BE) | pytest + httpx TestClient | API + test DB | All public endpoints |
| E2E | Playwright | Upload → query → cited answer | 3 critical paths |
| LLM eval | Custom pytest | RAG precision, citations | Manual per sprint |
| Load | Locust | Concurrent queries | 100 users baseline |

**Service test rule:** Every service method needs (1) happy path, (2) empty input, (3) error state.

---

## 9. Sprint Plan

**Cadence:** 10 days per sprint  
- Days 1–7: Development  
- Days 8–9: QA  
- Day 10: Rollout (flags, staging, demo)

**Total:** 5 sprints ≈ 50 days (~7 working weeks)

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| **1–2** | MVP | Auth, doc upload, RAG chat with citations, dashboard shell, feature flags, Redux + hooks |
| **3** | Project Agent | Slack/email webhooks, intent classification, ticket creation (flag-gated) |
| **4** | Integrations | Jira/Linear, workload balancing, multi-tenant isolation |
| **5** | Advanced | Analytics dashboard, audit log, custom LLM provider |

Sprint 1–2 must be **demoable** before advanced features.

---

## 10. Database Schema

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | id, email, role, org_id | Roles: admin, manager, employee |
| `organizations` | id, name, plan, settings_json | Multi-tenant from day one |
| `documents` | id, org_id, filename, storage_url, status | pending / processing / ready / error |
| `document_chunks` | id, document_id, content, embedding vector(1536), chunk_index | pgvector search |
| `queries` | id, user_id, query_text, answer_text, cited_chunks[], latency_ms | RAG audit log |
| `tickets` | id, org_id, source, raw_payload, intent, priority, assignee_id, external_ticket_id | source: slack or email |
| `activity_logs` | id, user_id, action, resource_type, resource_id, timestamp | Full audit trail |

---

## 11. LangGraph Agent Flows

### Knowledge Agent

```
START → parse_query → retrieve_chunks → grade_relevance → generate_answer → format_citations → END
                              ↓ (errors)
                        handle_error → END
```

### Project Agent

```
START → parse_webhook_payload → classify_intent → determine_priority → assign_owner
     → create_ticket → send_notification → END
                              ↓ (errors)
                        handle_error → END
```

---

## Appendix: Quick Reference for Agents

When implementing a task:

1. Read **§1 Current Progress** first.
2. Gate new UI behind **§7 feature flags**.
3. Follow **atomic design** and **hook-only** component access (**§5, §6**).
4. Use **Redux only via feature hooks** — never `useSelector` in components.
5. Keep server/RAG state in **hooks**, not Redux slices.
6. Backend: routers → services → repositories/agents (**§4.3**).
7. Update **§1.1 / §1.2** checkboxes when completing sprint work.

---

*End of Engineering Master Documentation*
