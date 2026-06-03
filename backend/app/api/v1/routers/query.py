import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, get_current_user, tenant_org_id
from app.models.schemas import QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_knowledge(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.KNOWLEDGE_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Knowledge agent is not enabled")

    agent = KnowledgeAgent()
    return await agent.run(
        db,
        body.query,
        user_id=auth.user_id,
        org_id=org_id or auth.org_id,
    )


@router.post("/query/stream")
async def query_knowledge_stream(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.KNOWLEDGE_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Knowledge agent is not enabled")

    agent = KnowledgeAgent()

    async def event_stream():
        async for line in agent.run_stream(
            db,
            body.query,
            user_id=auth.user_id,
            org_id=org_id or auth.org_id,
        ):
            yield f"data: {line}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
