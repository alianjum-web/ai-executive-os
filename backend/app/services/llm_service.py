from collections.abc import AsyncGenerator

from app.services.llm_providers import LLMProvider, build_llm_provider


class LLMService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider or build_llm_provider()

    @property
    def has_client(self) -> bool:
        return getattr(self._provider, "available", True)

    async def generate_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> str:
        return await self._provider.generate_answer(
            query, context, cite_with_markers=cite_with_markers
        )

    async def stream_answer(
        self, query: str, context: str, *, cite_with_markers: bool = False
    ) -> AsyncGenerator[str, None]:
        async for token in self._provider.stream_answer(
            query, context, cite_with_markers=cite_with_markers
        ):
            yield token
