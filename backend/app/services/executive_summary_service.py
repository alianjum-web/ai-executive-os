"""Executive KPI summary — ROI metrics for admins and managers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db.tables import Document, QueryLog, Ticket
from app.models.internal.domain import TopQuestionRow

# Industry average: 25 minutes per manual knowledge lookup.
_MINUTES_SAVED_PER_AUTOMATED_QUERY = 25


class ExecutiveSummaryService:
    async def get_summary(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        *,
        department: str | None = None,
    ) -> dict:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        query_base = select(func.count(QueryLog.id)).where(QueryLog.org_id == org_id)
        total_queries = (await db.execute(query_base)).scalar() or 0

        queries_today_stmt = query_base.where(QueryLog.created_at >= today_start)
        queries_today = (await db.execute(queries_today_stmt)).scalar() or 0

        escalated_stmt = query_base.where(QueryLog.escalated.is_(True))
        escalated_queries = (await db.execute(escalated_stmt)).scalar() or 0

        automated_queries = max(0, total_queries - escalated_queries)
        estimated_hours_saved = round(
            automated_queries * _MINUTES_SAVED_PER_AUTOMATED_QUERY / 60, 1
        )

        docs_stmt = select(func.count(Document.id)).where(
            Document.org_id == org_id,
            Document.status == "ready",
            Document.deleted_at.is_(None),
        )
        documents_ready = (await db.execute(docs_stmt)).scalar() or 0

        ticket_stmt = select(func.count(Ticket.id)).where(
            Ticket.org_id == org_id,
            Ticket.status.in_(("open", "in_progress", "pending_approval")),
        )
        if department:
            ticket_stmt = ticket_stmt.where(Ticket.department == department)
        open_tickets = (await db.execute(ticket_stmt)).scalar() or 0

        gaps_stmt = (
            select(QueryLog.query_text, func.count(QueryLog.id).label("count"))
            .where(
                QueryLog.org_id == org_id,
                QueryLog.escalated.is_(True),
            )
            .group_by(QueryLog.query_text)
            .order_by(func.count(QueryLog.id).desc())
            .limit(8)
        )
        gap_rows = (await db.execute(gaps_stmt)).all()
        knowledge_gaps: list[TopQuestionRow] = [
            {"question": row[0], "count": int(row[1])} for row in gap_rows
        ]

        low_conf_stmt = query_base.where(
            QueryLog.confidence_score.isnot(None),
            QueryLog.confidence_score < 0.45,
            QueryLog.escalated.is_(False),
        )
        low_confidence_unanswered = (await db.execute(low_conf_stmt)).scalar() or 0

        escalation_rate_pct = (
            round(100.0 * escalated_queries / total_queries, 1)
            if total_queries
            else 0.0
        )
        automation_rate_pct = (
            round(100.0 * automated_queries / total_queries, 1)
            if total_queries
            else 0.0
        )

        return {
            "total_queries": total_queries,
            "queries_today": queries_today,
            "automated_queries": automated_queries,
            "escalated_queries": escalated_queries,
            "estimated_hours_saved": estimated_hours_saved,
            "automation_rate_pct": automation_rate_pct,
            "escalation_rate_pct": escalation_rate_pct,
            "documents_ready": documents_ready,
            "open_tickets": open_tickets,
            "low_confidence_unanswered": low_confidence_unanswered,
            "knowledge_gaps": knowledge_gaps,
            "department_scope": department,
        }
