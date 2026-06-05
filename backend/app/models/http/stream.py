"""SSE payload types for POST /api/v1/query/stream."""

from __future__ import annotations

from typing import Literal, TypedDict, cast

from app.models.http.schemas import Citation


class StreamTokenEvent(TypedDict):
    type: Literal["token"]
    content: str


class StreamErrorEvent(TypedDict):
    type: Literal["error"]
    message: str


# JSON shape emitted by Citation.model_dump(mode="json") on the done event.
CitationJson = dict[str, str | int | None]


class StreamDoneEvent(TypedDict):
    type: Literal["done"]
    answer: str
    citations: list[CitationJson]
    latency_ms: int


def citation_to_json(citation: Citation) -> CitationJson:
    return cast(CitationJson, citation.model_dump(mode="json"))
