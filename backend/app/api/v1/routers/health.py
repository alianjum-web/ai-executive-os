import redis.asyncio as aioredis
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "version": "5.0.0"}


@router.get("/health/ready")
async def health_ready():
    checks: dict[str, str] = {"api": "ok"}
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    try:
        client = aioredis.from_url(settings.redis_url, decode_responses=True)
        await client.ping()
        await client.aclose()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    ready = all(v == "ok" for k, v in checks.items() if k != "api")
    return {"status": "ready" if ready else "degraded", "checks": checks}
