import csv
import io
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import QueryLog, Ticket


class ExportService:
    async def export_queries_csv(
        self, db: AsyncSession, org_id: uuid.UUID
    ) -> str:
        result = await db.execute(
            select(QueryLog)
            .where(QueryLog.org_id == org_id)
            .order_by(QueryLog.created_at.desc())
        )
        rows = result.scalars().all()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "id",
                "query_text",
                "answer_text",
                "latency_ms",
                "accuracy_rating",
                "created_at",
            ]
        )
        for row in rows:
            writer.writerow(
                [
                    str(row.id),
                    row.query_text,
                    (row.answer_text or "")[:5000],
                    row.latency_ms,
                    row.accuracy_rating,
                    row.created_at.isoformat() if row.created_at else "",
                ]
            )
        return buffer.getvalue()

    async def export_tickets_csv(
        self, db: AsyncSession, org_id: uuid.UUID
    ) -> str:
        result = await db.execute(
            select(Ticket)
            .where(Ticket.org_id == org_id)
            .options(selectinload(Ticket.assignee))
            .order_by(Ticket.created_at.desc())
        )
        tickets = result.scalars().all()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "id",
                "source",
                "intent",
                "priority",
                "summary",
                "department",
                "status",
                "assignee_email",
                "external_ticket_id",
                "created_at",
                "resolved_at",
            ]
        )
        for t in tickets:
            writer.writerow(
                [
                    str(t.id),
                    t.source,
                    t.intent,
                    t.priority,
                    t.summary,
                    t.department,
                    t.status,
                    t.assignee.email if t.assignee else "",
                    t.external_ticket_id,
                    t.created_at.isoformat() if t.created_at else "",
                    t.resolved_at.isoformat() if t.resolved_at else "",
                ]
            )
        return buffer.getvalue()
