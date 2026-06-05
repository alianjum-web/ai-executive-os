import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.db.tables import Ticket


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

    async def find_by_slack_message(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        *,
        slack_channel_id: str | None,
        slack_message_ts: str | None,
    ) -> Ticket | None:
        if not slack_channel_id or not slack_message_ts:
            return None
        result = await db.execute(
            select(Ticket)
            .where(
                Ticket.org_id == org_id,
                Ticket.slack_channel_id == slack_channel_id,
                Ticket.slack_message_ts == slack_message_ts,
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_ticket_record(
        self,
        db: AsyncSession,
        *,
        org_id: uuid.UUID,
        source: str,
        raw_payload: dict[str, Any],
        intent: str,
        priority: int,
        summary: str,
        department: str,
        assignee_id: uuid.UUID | None,
        slack_channel_id: str | None = None,
        slack_message_ts: str | None = None,
    ) -> Ticket:
        if slack_channel_id and slack_message_ts:
            existing = await self.find_by_slack_message(
                db,
                org_id,
                slack_channel_id=slack_channel_id,
                slack_message_ts=slack_message_ts,
            )
            if existing:
                return existing

        ticket = Ticket(
            org_id=org_id,
            source=source,
            title=(summary[:255] if summary else None),
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
        try:
            await db.commit()
            await db.refresh(ticket)
            return ticket
        except IntegrityError:
            await db.rollback()
            if slack_channel_id and slack_message_ts:
                existing = await self.find_by_slack_message(
                    db,
                    org_id,
                    slack_channel_id=slack_channel_id,
                    slack_message_ts=slack_message_ts,
                )
                if existing:
                    return existing
            raise
