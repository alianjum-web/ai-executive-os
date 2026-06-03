from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.database import get_db
from app.core.feature_flags import flags
from app.models.schemas import QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_knowledge(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
):
    if not flags.KNOWLEDGE_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Knowledge agent is not enabled")

    agent = KnowledgeAgent()
    return await agent.run(db, body.query, user_id=body.user_id)


@router.post("/query/stream")
async def query_knowledge_stream(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
):
    if not flags.KNOWLEDGE_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Knowledge agent is not enabled")

    agent = KnowledgeAgent()
    result = await agent.run(db, body.query, user_id=body.user_id)

    async def stream():
        yield f"data: {result.answer}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
