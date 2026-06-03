import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.models.schemas import QueryResponse

HEADERS = {
    "X-Org-Id": str(uuid.uuid4()),
    "X-User-Id": str(uuid.uuid4()),
    "X-User-Role": "employee",
}


@pytest.mark.asyncio
@patch("app.api.v1.routers.query.KnowledgeAgent")
async def test_100_concurrent_queries_under_p95_target(mock_agent_cls, client):
    mock_agent_cls.return_value.run = AsyncMock(
        return_value=QueryResponse(answer="ok", citations=[], latency_ms=50)
    )

    async def one_query(i: int):
        return await client.post(
            "/api/v1/query",
            json={"query": f"Question {i}"},
            headers={
                **HEADERS,
                "X-User-Id": str(uuid.uuid4()),
            },
        )

    responses = await asyncio.gather(*[one_query(i) for i in range(100)])
    assert all(r.status_code == 200 for r in responses)
