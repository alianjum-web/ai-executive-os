from collections.abc import AsyncGenerator
from typing import Protocol

from app.core.config import settings


class LLMProvider(Protocol):
    async def generate_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> str: ...

    async def stream_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> AsyncGenerator[str, None]: ...


class OpenAIProvider:
    def __init__(self) -> None:
        from openai import AsyncOpenAI

        self._client = (
            AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        )

    @property
    def available(self) -> bool:
        return self._client is not None

    async def generate_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> str:
        if not self._client:
            return _fallback_answer(context)
        response = await self._client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=_messages(query, context, cite_with_markers=cite_with_markers),
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    async def stream_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> AsyncGenerator[str, None]:
        if not self._client:
            async for token in _fallback_stream(context):
                yield token
            return
        stream = await self._client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=_messages(query, context, cite_with_markers=cite_with_markers),
            temperature=0.2,
            stream=True,
        )
        async for event in stream:
            delta = event.choices[0].delta.content
            if delta:
                yield delta


class AnthropicProvider:
    def __init__(self) -> None:
        self._client = None
        if settings.anthropic_api_key:
            from anthropic import AsyncAnthropic

            self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    @property
    def available(self) -> bool:
        return self._client is not None

    async def generate_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> str:
        if not self._client:
            return _fallback_answer(context)
        response = await self._client.messages.create(
            model=settings.anthropic_chat_model,
            max_tokens=2048,
            system=_system_prompt(cite_with_markers=cite_with_markers),
            messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}],
            temperature=0.2,
        )
        parts = [block.text for block in response.content if hasattr(block, "text")]
        return "".join(parts)

    async def stream_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> AsyncGenerator[str, None]:
        if not self._client:
            async for token in _fallback_stream(context):
                yield token
            return
        async with self._client.messages.stream(
            model=settings.anthropic_chat_model,
            max_tokens=2048,
            system=_system_prompt(cite_with_markers=cite_with_markers),
            messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}],
            temperature=0.2,
        ) as stream:
            async for text in stream.text_stream:
                yield text


def _system_prompt(*, cite_with_markers: bool = False) -> str:
    base = (
        "You answer questions using only the provided context. "
        "If the context is insufficient, say you do not know."
    )
    if cite_with_markers:
        base += (
            " Cite sources inline using [1], [2], etc. matching the numbered context blocks."
        )
    return base


def _messages(query: str, context: str, *, cite_with_markers: bool = False) -> list[dict]:
    return [
        {"role": "system", "content": _system_prompt(cite_with_markers=cite_with_markers)},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
    ]


def _fallback_answer(context: str) -> str:
    if not context.strip():
        return (
            "I don't have enough information in the knowledge base to answer that question."
        )
    return f"Based on the available documents: {context[:500]}..."


async def _fallback_stream(context: str) -> AsyncGenerator[str, None]:
    if not context.strip():
        yield (
            "I don't have enough information in the knowledge base to answer "
            "that question."
        )
        return
    text = f"Based on the available documents: {context[:500]}..."
    for word in text.split():
        yield word + " "


def build_llm_provider() -> LLMProvider:
    if settings.feature_custom_llm_provider_enabled:
        if settings.llm_provider.lower() == "anthropic":
            return AnthropicProvider()
    return OpenAIProvider()
