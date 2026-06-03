import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Document, QueryLog


class AnalyticsService:
    async def get_dashboard_metrics(
        self, db: AsyncSession, org_id: uuid.UUID
    ) -> dict:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        queries_today_stmt = select(func.count(QueryLog.id)).where(
            QueryLog.org_id == org_id,
            QueryLog.created_at >= today_start,
        )
        queries_today = (await db.execute(queries_today_stmt)).scalar() or 0

        latency_stmt = select(QueryLog.latency_ms).where(
            QueryLog.org_id == org_id,
            QueryLog.latency_ms.isnot(None),
        )
        latencies = [
            row[0] for row in (await db.execute(latency_stmt)).all() if row[0] is not None
        ]
        latencies.sort()
        p50 = self._percentile(latencies, 50)
        p95 = self._percentile(latencies, 95)

        docs_stmt = select(func.count(Document.id)).where(
            Document.org_id == org_id,
            Document.status == "ready",
        )
        documents_indexed = (await db.execute(docs_stmt)).scalar() or 0

        top_questions_stmt = (
            select(QueryLog.query_text, func.count(QueryLog.id).label("count"))
            .where(QueryLog.org_id == org_id)
            .group_by(QueryLog.query_text)
            .order_by(func.count(QueryLog.id).desc())
            .limit(10)
        )
        top_rows = (await db.execute(top_questions_stmt)).all()
        top_questions = [
            {"question": row[0], "count": row[1]} for row in top_rows
        ]

        return {
            "queries_today": queries_today,
            "latency_p50_ms": p50,
            "latency_p95_ms": p95,
            "documents_indexed": documents_indexed,
            "top_questions": top_questions,
        }

    @staticmethod
    def _percentile(values: list[int], pct: int) -> int | None:
        if not values:
            return None
        k = max(0, int(len(values) * pct / 100) - 1)
        return values[min(k, len(values) - 1)]
