from openai import AsyncOpenAI

from app.core.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed(self, text: str) -> list[float]:
        vectors = await self.embed_many([text], batch_size=1)
        return vectors[0]

    async def embed_many(
        self, texts: list[str], *, batch_size: int | None = None
    ) -> list[list[float]]:
        if not texts:
            return []

        batch_size = batch_size or settings.embedding_batch_size
        results: list[list[float]] = []

        for offset in range(0, len(texts), batch_size):
            batch = texts[offset : offset + batch_size]
            results.extend(await self._embed_batch(batch))

        if any(len(v) != settings.embedding_dimensions for v in results):
            raise ValueError("Embedding dimension mismatch")
        return results

    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        cleaned = [t.strip() for t in texts]
        if any(not t for t in cleaned):
            raise ValueError("Cannot embed empty text")

        if self._client:
            response = await self._client.embeddings.create(
                model=settings.openai_embedding_model,
                input=cleaned,
            )
            ordered = sorted(response.data, key=lambda row: row.index)
            return [row.embedding for row in ordered]

        import hashlib

        vectors: list[list[float]] = []
        for text in cleaned:
            digest = hashlib.sha256(text.encode()).digest()
            vector = []
            for i in range(settings.embedding_dimensions):
                byte = digest[i % len(digest)]
                vector.append((byte / 255.0) * 2 - 1)
            vectors.append(vector)
        return vectors
