import re

from openai import AsyncOpenAI

from app.core.config import settings


class GradingService:
    """LLM grades chunk relevance 1-5 (gpt-4o-mini); chunks scoring <=2 are dropped."""

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def grade_chunk(self, query: str, chunk_text: str) -> int:
        if not chunk_text.strip():
            return 1

        if self._client:
            response = await self._client.chat.completions.create(
                model=settings.openai_grading_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Rate document chunk relevance to the question. "
                            "Reply with ONLY one integer 1-5."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Question: {query}\n\nChunk:\n{chunk_text[:1500]}"
                        ),
                    },
                ],
                temperature=0,
            )
            raw = response.choices[0].message.content or ""
            match = re.search(r"[1-5]", raw)
            if match:
                return int(match.group())

        return self._heuristic_grade(query, chunk_text)

    def _heuristic_grade(self, query: str, chunk_text: str) -> int:
        q_words = {w.lower() for w in re.findall(r"\w+", query) if len(w) > 3}
        c_words = {w.lower() for w in re.findall(r"\w+", chunk_text)}
        if not q_words:
            return 3
        overlap = len(q_words & c_words) / len(q_words)
        if overlap >= 0.5:
            return 5
        if overlap >= 0.25:
            return 4
        if overlap >= 0.1:
            return 3
        if overlap > 0:
            return 2
        return 1

    async def filter_chunks(
        self, query: str, chunks: list[dict], min_grade: int = 3
    ) -> list[dict]:
        graded: list[dict] = []
        for item in chunks:
            score = await self.grade_chunk(query, item["content"])
            item["grade"] = score
            if score >= min_grade:
                graded.append(item)
        return graded
