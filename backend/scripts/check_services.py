"""Preflight: verify Postgres and Redis before starting uvicorn/celery."""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `npm run db:check` from backend/ (same layout as uvicorn).
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from sqlalchemy import create_engine, text


def main() -> int:
    from app.core.config import settings

    sync_url = settings.database_url.replace("+asyncpg", "")
    print("Checking Postgres…", settings.database_url.split("@")[-1], flush=True)
    try:
        engine = create_engine(sync_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print("\nPostgres check failed:", exc, file=sys.stderr)
        print(
            "\nFix: start Docker deps (npm run deps:docker) or match DATABASE_URL in backend/.env",
            file=sys.stderr,
        )
        print("Test: PGPASSWORD=<pass> psql -h localhost -U postgres -d sop_automator -c 'SELECT 1'",
              file=sys.stderr)
        return 1

    print("Checking Redis…", settings.redis_url, flush=True)
    try:
        import redis

        client = redis.from_url(settings.redis_url, socket_connect_timeout=3)
        client.ping()
    except Exception as exc:
        print("\nRedis check failed:", exc, file=sys.stderr)
        print("\nFix: npm run deps:docker  or set REDIS_URL in backend/.env", file=sys.stderr)
        return 1

    print("Postgres and Redis OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
