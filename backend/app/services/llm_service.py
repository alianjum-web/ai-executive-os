import logging
from collections.abc import AsyncGenerator

import httpx
from openai import AsyncOpenAI

from app.core.config import settings
from app.prompts.knowledge_rag import KNOWLEDGE_AGENT_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    @property
    def has_openai_client(self) -> bool:
        return self._client is not None

    @property
    def has_client(self) -> bool:
        return self.has_openai_client or bool(settings.gemini_api_key)

    def _context_excerpt_fallback(self, context: str) -> str:
        return f"Based on the available documents: {context[:2000]}..."

    async def _gemini_complete(self, system: str, user: str) -> str | None:
        model = settings.gemini_chat_model
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"temperature": 0.2},
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    params={"key": settings.gemini_api_key},
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status == 429:
                logger.warning("Gemini rate limited (429); using document excerpt fallback")
            else:
                logger.warning("Gemini HTTP %s; using document excerpt fallback", status)
            return None
        except httpx.HTTPError as exc:
            logger.warning("Gemini request failed: %s", exc)
            return None

        candidates = data.get("candidates") or []
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts).strip()
        return text or None

    async def generate_answer(self, query: str, context: str) -> str:
        system = KNOWLEDGE_AGENT_SYSTEM_PROMPT
        user = f"Retrieved chunks:\n{context}\n\nUser question: {query}"

        if self._client:
            response = await self._client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content or ""

        if settings.gemini_api_key and context.strip():
            answer = await self._gemini_complete(system, user)
            if answer:
                return answer
            return self._context_excerpt_fallback(context)

        if not context.strip():
            return (
                "I don't have enough information in the knowledge base to answer that question."
            )
        return f"Based on the available documents: {context[:500]}..."

    async def stream_answer(self, query: str, context: str) -> AsyncGenerator[str, None]:
        if not context.strip():
            yield (
                "I don't have enough information in the knowledge base to answer "
                "that question."
            )
            return

        system = KNOWLEDGE_AGENT_SYSTEM_PROMPT
        user = f"Retrieved chunks:\n{context}\n\nUser question: {query}"

        if self._client:
            stream = await self._client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
                stream=True,
            )
            async for event in stream:
                delta = event.choices[0].delta.content
                if delta:
                    yield delta
            return

        if settings.gemini_api_key:
            answer = await self._gemini_complete(system, user)
            if answer:
                yield answer
                return

        text = self._context_excerpt_fallback(context)
        for word in text.split():
            yield word + " "
