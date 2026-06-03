from dataclasses import dataclass

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


@dataclass
class TextChunk:
    content: str
    chunk_index: int
    page_number: int | None = None


class ChunkingService:
    """Semantic chunks ≤800 tokens via LangChain RecursiveCharacterTextSplitter."""

    def __init__(self, max_tokens: int | None = None) -> None:
        max_tokens = max_tokens or settings.max_chunk_tokens
        self._splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=max_tokens,
            chunk_overlap=min(100, max_tokens // 8),
        )
        self._encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        if not text.strip():
            return 0
        return len(self._encoding.encode(text))

    def chunk_text(
        self,
        text: str,
        page_number: int | None = None,
        *,
        start_index: int = 0,
    ) -> list[TextChunk]:
        cleaned = text.strip()
        if not cleaned:
            return []

        parts = self._splitter.split_text(cleaned)
        chunks: list[TextChunk] = []
        for i, part in enumerate(parts):
            if part.strip():
                chunks.append(
                    TextChunk(
                        content=part.strip(),
                        chunk_index=start_index + i,
                        page_number=page_number,
                    )
                )
        return chunks
