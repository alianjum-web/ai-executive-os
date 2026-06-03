import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.agents.knowledge_agent import KnowledgeAgent
from app.models.schemas import Citation, QueryResponse


@pytest.mark.asyncio
@patch("app.agents.knowledge_agent.flags")
async def test_cached_query_skips_llm_pipeline(mock_flags):
    mock_flags.RAG_CACHE_ENABLED = True
    org_id = uuid.uuid4()
    cached_payload = {
        "answer": "Cached PTO answer",
        "citations": [
            {
                "chunk_id": str(uuid.uuid4()),
                "document_name": "policy.md",
                "page_number": 1,
                "chunk_text": "20 days PTO",
                "excerpt": "20 days",
            }
        ],
        "latency_ms": 5,
    }

    agent = KnowledgeAgent()
    agent.cache.get_cached_answer = AsyncMock(return_value=cached_payload)
    agent._retrieve = AsyncMock()
    agent.graph = AsyncMock()

    db = AsyncMock()
    result = await agent.run(db, "How much PTO?", org_id=org_id)

    assert result.cached is True
    assert result.answer == "Cached PTO answer"
    assert result.latency_ms == 5
    agent._retrieve.assert_not_called()


@pytest.mark.asyncio
@patch("app.core.cache.aioredis")
async def test_cache_key_uses_query_and_org(mock_redis_module):
    from app.core.cache import QueryCacheService

    service = QueryCacheService()
    k1 = service.cache_key("Hello", "org-a")
    k2 = service.cache_key("hello", "org-a")
    k3 = service.cache_key("Hello", "org-b")
    assert k1 == k2
    assert k1 != k3
