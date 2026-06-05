import json
import re
from collections.abc import Sequence
from typing import cast

from app.models.internal.domain import CitationRaw, RagChunkItem

_METADATA_BLOCK = re.compile(
    r"```json-metadata\s*([\s\S]*?)\s*```\s*$",
    re.IGNORECASE,
)


def strip_metadata_block(raw: str) -> tuple[str, dict | None]:
    """Remove trailing json-metadata fence and return parsed JSON if valid."""
    match = _METADATA_BLOCK.search(raw.strip())
    if not match:
        return raw.strip(), None
    clean = raw[: match.start()].rstrip()
    try:
        payload = json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        return clean, None
    return clean, payload if isinstance(payload, dict) else None


def merge_citations(
    metadata: dict[str, object] | None,
    chunk_items: Sequence[RagChunkItem],
    *,
    fallback_from_chunks: bool = True,
) -> list[CitationRaw]:
    """Build API citation rows from LLM json-metadata and/or retrieval chunks."""
    by_chunk: dict[str, dict] = {
        str(item["chunk_id"]): {
            "chunk_id": str(item["chunk_id"]),
            "document_id": str(item["document_id"]) if item.get("document_id") else None,
            "document_name": item["document_name"],
            "page_number": item.get("page_number"),
            "chunk_text": item["content"],
            "excerpt": item["content"][:200],
            "exact_quote_highlight": None,
            "citation_index": None,
        }
        for item in chunk_items
        if item.get("chunk_id")
    }

    raw_citations = (metadata or {}).get("citations")
    meta_list = raw_citations if isinstance(raw_citations, list) else []
    merged: list[CitationRaw] = []
    seen: set[str] = set()

    for entry in meta_list:
        if not isinstance(entry, dict):
            continue
        chunk_id = entry.get("chunk_id")
        key = str(chunk_id) if chunk_id else ""
        base = by_chunk.get(key, {})
        doc_name = entry.get("document_name") or base.get("document_name") or "unknown"
        row = {
            "chunk_id": key or base.get("chunk_id"),
            "document_id": base.get("document_id"),
            "document_name": doc_name,
            "page_number": entry.get("page_number", base.get("page_number")),
            "chunk_text": base.get("chunk_text") or entry.get("exact_quote_highlight") or "",
            "excerpt": (entry.get("exact_quote_highlight") or base.get("excerpt") or "")[:200],
            "exact_quote_highlight": entry.get("exact_quote_highlight"),
            "citation_index": entry.get("id"),
        }
        dedupe = key or f"{doc_name}:{row.get('page_number')}:{row.get('citation_index')}"
        if dedupe in seen:
            continue
        seen.add(dedupe)
        merged.append(cast(CitationRaw, row))

    if merged or not fallback_from_chunks:
        return merged

    for item in chunk_items:
        cid = str(item.get("chunk_id", ""))
        if cid and cid not in seen:
            seen.add(cid)
            merged.append(cast(CitationRaw, by_chunk[cid]))
    return merged


def parse_knowledge_answer(
    raw: str, chunk_items: Sequence[RagChunkItem]
) -> tuple[str, list[CitationRaw]]:
    clean, metadata = strip_metadata_block(raw)
    citations = merge_citations(metadata, chunk_items)
    return clean, citations
