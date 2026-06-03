import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.rate_limit import limiter
from app.core.security import AuthContext, get_current_user, tenant_org_id
from app.models.database import QueryLog
from app.models.schemas import QueryRatingRequest, QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
@limiter.limit("60/minute")
async def query_knowledge(
    request: Request,
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
@limiter.limit("60/minute")
async def query_knowledge_stream(
    request: Request,
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


@router.post("/query/{query_id}/rating", status_code=204)
async def rate_query(
    query_id: uuid.UUID,
    body: QueryRatingRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    result = await db.execute(select(QueryLog).where(QueryLog.id == query_id))
    log = result.scalar_one_or_none()
    if not log or (log.org_id and log.org_id != (org_id or auth.org_id)):
        raise HTTPException(status_code=404, detail="Query not found")
    log.accuracy_rating = body.rating
    await db.commit()
