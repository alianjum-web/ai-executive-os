from unittest.mock import AsyncMock, patch

import pytest

from app.agents.knowledge_agent import KnowledgeAgent


@pytest.mark.asyncio
async def test_pipeline_reranks_before_grading():
    agent = KnowledgeAgent()
    call_order: list[str] = []

    async def track_rerank(*args, **kwargs):
        call_order.append("rerank")
        return [{"content": "PTO text", "chunk_id": "1", "document_name": "a.pdf", "score": 0.9}]

    async def track_grade(query, chunks, min_grade=3):
        call_order.append("grade")
        for item in chunks:
            item["grade"] = 4
        return chunks

    with patch.object(agent.reranker, "rerank", side_effect=track_rerank), patch.object(
        agent.grader, "filter_chunks", side_effect=track_grade
    ), patch.object(agent.llm, "generate_answer", AsyncMock(return_value="Answer [1]")), patch.object(
        agent, "_retrieve", AsyncMock(return_value=[{"content": "x", "chunk_id": "1", "document_name": "a.pdf"}])
    ):
        await agent._run_graph("PTO policy?", [{"content": "x", "chunk_id": "1", "document_name": "a.pdf"}])

    assert call_order.index("rerank") < call_order.index("grade")
