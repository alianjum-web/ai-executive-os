from openai import AsyncOpenAI

from app.core.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed(self, text: str) -> list[float]:
        if not text.strip():
            raise ValueError("Cannot embed empty text")

        if self._client:
            response = await self._client.embeddings.create(
                model=settings.openai_embedding_model,
                input=text,
            )
            vector = response.data[0].embedding
        else:
            # Deterministic fallback for local dev / tests without API key
            import hashlib

            digest = hashlib.sha256(text.encode()).digest()
            vector = []
            for i in range(settings.embedding_dimensions):
                byte = digest[i % len(digest)]
                vector.append((byte / 255.0) * 2 - 1)

        if len(vector) != settings.embedding_dimensions:
            raise ValueError(
                f"Expected {settings.embedding_dimensions} dimensions, got {len(vector)}"
            )
        return vector
