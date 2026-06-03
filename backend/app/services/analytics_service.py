import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Document, QueryLog, Ticket


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

    async def get_advanced_metrics(
        self, db: AsyncSession, org_id: uuid.UUID, *, days: int = 30
    ) -> dict:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        base = await self.get_dashboard_metrics(db, org_id)

        volume_stmt = (
            select(
                func.date_trunc("day", QueryLog.created_at).label("day"),
                func.count(QueryLog.id).label("count"),
            )
            .where(QueryLog.org_id == org_id, QueryLog.created_at >= since)
            .group_by(func.date_trunc("day", QueryLog.created_at))
            .order_by(func.date_trunc("day", QueryLog.created_at))
        )
        volume_rows = (await db.execute(volume_stmt)).all()
        query_volume_by_day = [
            {"date": row[0].date().isoformat() if row[0] else "", "count": row[1]}
            for row in volume_rows
        ]

        latency_rows = (
            await db.execute(
                select(QueryLog.latency_ms).where(
                    QueryLog.org_id == org_id,
                    QueryLog.latency_ms.isnot(None),
                    QueryLog.created_at >= since,
                )
            )
        ).all()
        latencies = [r[0] for r in latency_rows if r[0] is not None]
        latency_histogram = self._histogram(latencies, bins=[0, 500, 1000, 2000, 5000, 10000])

        ticket_rows = (
            await db.execute(
                select(Ticket.created_at, Ticket.resolved_at, Ticket.updated_at, Ticket.status).where(
                    Ticket.org_id == org_id,
                    Ticket.created_at >= since,
                )
            )
        ).all()
        resolution_minutes: list[float] = []
        for created, resolved, updated, status in ticket_rows:
            end = resolved or (updated if status in ("synced", "assigned", "closed") else None)
            if created and end:
                resolution_minutes.append((end - created).total_seconds() / 60.0)
        resolution_histogram = self._histogram(
            resolution_minutes,
            bins=[0, 30, 60, 240, 1440, 10080],
            labels=["<30m", "30m-1h", "1-4h", "4-24h", "1-7d", ">7d"],
        )

        rating_stmt = select(
            func.avg(QueryLog.accuracy_rating),
            func.count(QueryLog.accuracy_rating),
        ).where(
            QueryLog.org_id == org_id,
            QueryLog.accuracy_rating.isnot(None),
            QueryLog.created_at >= since,
        )
        avg_rating, rated_count = (await db.execute(rating_stmt)).one()
        agent_accuracy_score = (
            round(float(avg_rating), 2) if avg_rating is not None else None
        )

        return {
            **base,
            "query_volume_by_day": query_volume_by_day,
            "latency_histogram": latency_histogram,
            "ticket_resolution_histogram": resolution_histogram,
            "agent_accuracy_score": agent_accuracy_score,
            "rated_queries_count": rated_count or 0,
            "period_days": days,
        }

    @staticmethod
    def _percentile(values: list[int], pct: int) -> int | None:
        if not values:
            return None
        k = max(0, int(len(values) * pct / 100) - 1)
        return values[min(k, len(values) - 1)]

    @staticmethod
    def _histogram(
        values: list[float],
        *,
        bins: list[float],
        labels: list[str] | None = None,
    ) -> list[dict]:
        if not values:
            return []
        labels = labels or [
            f"{int(bins[i])}-{int(bins[i + 1])}" for i in range(len(bins) - 1)
        ] + [f">{int(bins[-1])}"]
        counts = [0] * len(labels)
        for v in values:
            placed = False
            for i in range(len(bins) - 1):
                if bins[i] <= v < bins[i + 1]:
                    counts[i] += 1
                    placed = True
                    break
            if not placed and v >= bins[-1]:
                counts[-1] += 1
        return [{"bucket": labels[i], "count": counts[i]} for i in range(len(labels))]
