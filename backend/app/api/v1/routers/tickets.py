import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, get_current_user, tenant_org_id
from app.models.schemas import TicketResponse
from app.services.ticket_service import TicketService

router = APIRouter()


@router.get("/tickets", response_model=list[TicketResponse])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.PROJECT_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Project agent is not enabled")

    service = TicketService()
    tickets = await service.list_tickets(db, org_id=org_id or auth.org_id)
    return [
        TicketResponse(
            id=t.id,
            source=t.source,
            title=t.title or t.summary,
            intent=t.intent,
            priority=t.priority,
            summary=t.summary,
            department=t.department,
            status=t.status,
            assignee_email=t.assignee.email if t.assignee else None,
            assignee_name=t.assignee.full_name if t.assignee else None,
            assignee_id=t.assignee_id,
            slack_channel_id=t.slack_channel_id,
            due_at=t.due_at,
            created_at=t.created_at,
        )
        for t in tickets
    ]
