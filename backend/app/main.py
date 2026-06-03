import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.routers import analytics, export, health, ingest, query, tickets, webhooks
from app.api.v1.routers import settings as settings_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.startup import run_startup_validation

logging.basicConfig(level=logging.INFO)

API_DESCRIPTION = """
## SOP Automator API

Knowledge Agent (RAG), document ingestion, multi-tenant org isolation, and admin analytics.

### Authentication
Send `Authorization: Bearer <supabase_jwt>` with `user_metadata.org_id` and `user_metadata.role`.

For local dev without JWT secret, use headers: `X-Org-Id`, `X-User-Id`, `X-User-Role` (`admin` | `employee`).

### Sprint 5 — Production readiness
- `GET /api/v1/analytics/advanced` — 30-day charts, latency histogram, accuracy score
- `GET /api/v1/export/queries.csv` / `tickets.csv` — compliance exports (admin)
- `GET /api/v1/health/ready` — DB + Redis readiness
- Rate limits: 60 queries/min per user, 10 uploads/hour per org
- RAG response cache (Redis, 1h TTL per query+org)
"""


def _init_sentry() -> None:
    if not settings.sentry_dsn:
        return
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=settings.sentry_traces_sample_rate,
        environment=settings.app_env,
    )


_init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_startup_validation()
    yield


app = FastAPI(
    title="SOP Automator API",
    version="5.0.0",
    description=API_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
app.include_router(export.router, prefix=api_prefix, tags=["export"])
app.include_router(webhooks.router, prefix=api_prefix, tags=["webhooks"])
app.include_router(tickets.router, prefix=api_prefix, tags=["tickets"])
app.include_router(settings_router.router, prefix=api_prefix, tags=["settings"])
