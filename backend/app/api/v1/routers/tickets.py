import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, get_current_user, tenant_org_id
from app.models.schemas import ActivityLogEntry, TicketDetailResponse, TicketResponse
from app.services.integration_settings_service import IntegrationSettingsService
from app.services.ticket_service import TicketService

router = APIRouter()


def _ticket_response(t) -> TicketResponse:
    return TicketResponse(
        id=t.id,
        source=t.source,
        intent=t.intent,
        priority=t.priority,
        summary=t.summary,
        department=t.department,
        status=t.status,
        assignee_email=t.assignee.email if t.assignee else None,
        assignee_id=t.assignee_id,
        slack_channel_id=t.slack_channel_id,
        external_ticket_id=t.external_ticket_id,
        created_at=t.created_at,
    )


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
    return [_ticket_response(t) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket_detail(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.PROJECT_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Project agent is not enabled")

    resolved_org = org_id or auth.org_id
    service = TicketService()
    ticket = await service.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.org_id and ticket.org_id != resolved_org:
        raise HTTPException(status_code=404, detail="Ticket not found")

    settings_row = await IntegrationSettingsService().get_for_org(db, resolved_org)
    jira_url = None
    if ticket.external_ticket_id and settings_row and settings_row.jira_site_url:
        jira_url = (
            f"{settings_row.jira_site_url.rstrip('/')}/browse/{ticket.external_ticket_id}"
        )

    logs = await service.list_activity_for_ticket(db, ticket_id, org_id=resolved_org)
    base = _ticket_response(ticket)
    return TicketDetailResponse(
        **base.model_dump(),
        raw_payload=ticket.raw_payload,
        jira_url=jira_url,
        audit_timeline=[
            ActivityLogEntry(
                id=log.id,
                action=log.action,
                resource_type=log.resource_type,
                user_id=log.user_id,
                created_at=log.created_at,
            )
            for log in logs
        ],
    )
