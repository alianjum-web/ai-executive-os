import hashlib
import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 3600


class QueryCacheService:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None

    async def _client(self) -> aioredis.Redis | None:
        if not settings.redis_url:
            return None
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    @staticmethod
    def cache_key(query_text: str, org_id: str | None) -> str:
        normalized = query_text.strip().lower()
        raw = f"{normalized}:{org_id or 'global'}"
        digest = hashlib.sha256(raw.encode()).hexdigest()
        return f"rag:answer:{digest}"

    async def get_cached_answer(
        self, query_text: str, org_id: str | None
    ) -> dict[str, Any] | None:
        client = await self._client()
        if not client:
            return None
        try:
            raw = await client.get(self.cache_key(query_text, org_id))
            if not raw:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("cache_get_failed: %s", exc)
            return None

    async def set_cached_answer(
        self,
        query_text: str,
        org_id: str | None,
        payload: dict[str, Any],
        *,
        ttl_seconds: int = _CACHE_TTL_SECONDS,
    ) -> None:
        client = await self._client()
        if not client:
            return
        try:
            await client.setex(
                self.cache_key(query_text, org_id),
                ttl_seconds,
                json.dumps(payload),
            )
        except Exception as exc:
            logger.warning("cache_set_failed: %s", exc)
