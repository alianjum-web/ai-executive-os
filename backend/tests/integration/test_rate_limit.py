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
async def test_61st_query_returns_429(mock_agent_cls, client):
    mock_agent_cls.return_value.run = AsyncMock(
        return_value=QueryResponse(answer="ok", citations=[], latency_ms=10)
    )

    for _ in range(60):
        response = await client.post(
            "/api/v1/query",
            json={"query": "What is PTO?"},
            headers=HEADERS,
        )
        assert response.status_code == 200

    blocked = await client.post(
        "/api/v1/query",
        json={"query": "What is PTO?"},
        headers=HEADERS,
    )
    assert blocked.status_code == 429
