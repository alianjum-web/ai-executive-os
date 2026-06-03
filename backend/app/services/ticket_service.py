import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import ActivityLog, Ticket


class TicketService:
    async def list_tickets(
        self,
        db: AsyncSession,
        org_id: uuid.UUID | None = None,
        limit: int = 100,
    ) -> list[Ticket]:
        stmt = (
            select(Ticket)
            .order_by(Ticket.created_at.desc())
            .limit(limit)
            .options(selectinload(Ticket.assignee))
        )
        if org_id is not None:
            stmt = stmt.where(Ticket.org_id == org_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_ticket(self, db: AsyncSession, ticket_id: uuid.UUID) -> Ticket | None:
        result = await db.execute(
            select(Ticket)
            .where(Ticket.id == ticket_id)
            .options(selectinload(Ticket.assignee))
        )
        return result.scalar_one_or_none()

    async def list_activity_for_ticket(
        self,
        db: AsyncSession,
        ticket_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
    ) -> list[ActivityLog]:
        stmt = (
            select(ActivityLog)
            .where(
                ActivityLog.resource_type == "ticket",
                ActivityLog.resource_id == ticket_id,
            )
            .order_by(ActivityLog.created_at.asc())
        )
        if org_id is not None:
            stmt = stmt.where(ActivityLog.org_id == org_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_ticket_record(
        self,
        db: AsyncSession,
        *,
        org_id: uuid.UUID,
        source: str,
        raw_payload: dict,
        intent: str,
        priority: int,
        summary: str,
        department: str,
        assignee_id: uuid.UUID | None,
        slack_channel_id: str | None = None,
        slack_message_ts: str | None = None,
    ) -> Ticket:
        ticket = Ticket(
            org_id=org_id,
            source=source,
            raw_payload=raw_payload,
            intent=intent,
            priority=priority,
            summary=summary,
            department=department,
            assignee_id=assignee_id,
            status="assigned" if assignee_id else "open",
            slack_channel_id=slack_channel_id,
            slack_message_ts=slack_message_ts,
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        return ticket
