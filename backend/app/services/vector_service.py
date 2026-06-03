from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import DocumentChunk


class VectorService:
    async def store_chunks(
        self, db: AsyncSession, chunks: list[DocumentChunk]
    ) -> None:
        db.add_all(chunks)
        await db.commit()

    async def similarity_search(
        self,
        db: AsyncSession,
        embedding: list[float],
        top_k: int = 5,
        min_score: float = 0.25,
    ) -> list[tuple[DocumentChunk, float]]:
        distance = DocumentChunk.embedding.cosine_distance(embedding)
        stmt = (
            select(DocumentChunk, (1 - distance).label("score"))
            .where(DocumentChunk.embedding.isnot(None))
            .order_by(distance)
            .limit(top_k)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [
            (row[0], float(row[1]))
            for row in rows
            if row[1] is not None and float(row[1]) >= min_score
        ]
