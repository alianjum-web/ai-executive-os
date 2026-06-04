from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import analytics, health, ingest, query, tickets, webhooks
from app.core.config import settings

API_DESCRIPTION = """
## SOP Automator API

Knowledge Agent (RAG), document ingestion, multi-tenant org isolation, and admin analytics.

### Authentication
Send `Authorization: Bearer <supabase_jwt>` with `user_metadata.org_id` and `user_metadata.role`.

For local dev (`APP_ENV=development`), you may use headers: `X-Org-Id`, `X-User-Id`, `X-User-Role` (`admin` | `employee`). Production requires a verified Supabase JWT (`SUPABASE_URL` + JWKS).

### Sprint 2 endpoints
- `POST /api/v1/query/stream` — SSE token streaming with citations on `done` event
- `GET /api/v1/analytics/dashboard` — admin metrics (requires admin role)
- `DELETE /api/v1/documents/{id}` — cascade delete chunks/embeddings

### Sprint 3 — Project Agent
- `POST /api/v1/webhook/slack` — Slack Events API (url_verification + message.channels)
- `GET /api/v1/tickets` — Ticket feed (org-scoped)
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="SOP Automator API",
    version="3.0.0",
    description=API_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(health.router, prefix=api_prefix, tags=["health"])
app.include_router(ingest.router, prefix=api_prefix, tags=["documents"])
app.include_router(query.router, prefix=api_prefix, tags=["knowledge"])
app.include_router(analytics.router, prefix=api_prefix, tags=["analytics"])
app.include_router(webhooks.router, prefix=api_prefix, tags=["webhooks"])
app.include_router(tickets.router, prefix=api_prefix, tags=["tickets"])
