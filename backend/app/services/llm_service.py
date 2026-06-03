from openai import AsyncOpenAI

from app.core.config import settings


class LLMService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate_answer(self, query: str, context: str) -> str:
        if self._client:
            response = await self._client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You answer questions using only the provided context. "
                            "If the context is insufficient, say you do not know."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context}\n\nQuestion: {query}",
                    },
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content or ""

        if not context.strip():
            return (
                "I don't have enough information in the knowledge base to answer that question."
            )
        return f"Based on the available documents: {context[:500]}..."
