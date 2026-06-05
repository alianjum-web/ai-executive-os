import json
import time
import uuid
from collections.abc import AsyncGenerator
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.db.tables import QueryLog
from app.models.internal.domain import (
    CitationRaw,
    GradedRagChunkItem,
    RagChunkItem,
    as_graded_chunks,
)
from app.models.http.schemas import Citation, QueryResponse
from app.models.http.stream import StreamDoneEvent, citation_to_json
from app.services.embedding_service import EmbeddingService
from app.services.grading_service import GradingService
from app.services.llm_service import LLMService
from app.services.rerank_service import RerankService
from app.services.citation_parser import parse_knowledge_answer
from app.services.rag_context import format_rag_context
from app.services.vector_service import VectorService


class KnowledgeState(TypedDict, total=False):
    query: str
    parsed_query: str
    chunk_items: list[GradedRagChunkItem]
    context: str
    answer: str
    citations: list[CitationRaw]


# LangGraph node partial returns use the same shape as state updates.
KnowledgeStateUpdate = KnowledgeState


class KnowledgeAgent:
    def __init__(self) -> None:
        self.embedder = EmbeddingService()
        self.llm = LLMService()
        self.vector = VectorService()
        self.grader = GradingService()
        self.reranker = RerankService()
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(KnowledgeState)
        workflow.add_node("parse_query", self._parse_query)
        workflow.add_node("grade_relevance", self._grade_relevance)
        workflow.add_node("rerank_chunks", self._rerank_chunks)
        workflow.add_node("generate_answer", self._generate_answer)
        workflow.add_node("format_citations", self._format_citations)
        workflow.set_entry_point("parse_query")
        workflow.add_edge("parse_query", "grade_relevance")
        workflow.add_edge("grade_relevance", "rerank_chunks")
        workflow.add_edge("rerank_chunks", "generate_answer")
        workflow.add_edge("generate_answer", "format_citations")
        workflow.add_edge("format_citations", END)
        return workflow.compile()

    async def _parse_query(self, state: KnowledgeState) -> KnowledgeStateUpdate:
        return {"parsed_query": state.get("query", "").strip()}

    async def _grade_relevance(self, state: KnowledgeState) -> KnowledgeStateUpdate:
        chunks = list(state.get("chunk_items", []))
        graded = await self.grader.filter_chunks(
            state.get("parsed_query", state.get("query", "")),
            chunks,
            min_grade=settings.min_relevance_grade,
        )
        if not graded and chunks:
            graded = sorted(chunks, key=lambda c: c.get("score", 0), reverse=True)[
                : settings.rerank_top_k
            ]
        return {"chunk_items": graded}

    async def _rerank_chunks(self, state: KnowledgeState) -> KnowledgeStateUpdate:
        reranked = await self.reranker.rerank(
            state.get("parsed_query", state.get("query", "")),
            list(state.get("chunk_items", [])),
            top_n=settings.rerank_top_k,
        )
        return {"chunk_items": reranked}

    async def _generate_answer(self, state: KnowledgeState) -> KnowledgeStateUpdate:
        items = state.get("chunk_items", [])
        if not items:
            return {
                "answer": (
                    "I don't have enough information in the knowledge base to answer "
                    "that question."
                ),
                "context": "",
            }
        context = format_rag_context(items)
        parsed = state.get("parsed_query", state.get("query", ""))
        raw_answer = await self.llm.generate_answer(parsed, context)
        answer, citations = parse_knowledge_answer(
            raw_answer, list(state.get("chunk_items", []))
        )
        return {"answer": answer, "context": context, "citations": citations}

    async def _format_citations(self, state: KnowledgeState) -> KnowledgeStateUpdate:
        if state.get("citations"):
            return {"citations": state["citations"]}
        citations = []
        for item in state.get("chunk_items", []):
            citations.append(
                {
                    "chunk_id": str(item["chunk_id"]),
                    "document_id": str(item["document_id"])
                    if item.get("document_id")
                    else None,
                    "document_name": item["document_name"],
                    "page_number": item.get("page_number"),
                    "chunk_text": item["content"],
                    "excerpt": item["content"][:200],
                }
            )
        return {"citations": citations}

    async def _retrieve(
        self, db: AsyncSession, query: str, org_id: uuid.UUID | None
    ) -> list[RagChunkItem]:
        embedding = await self.embedder.embed(query)
        min_score = 0.2 if self.embedder.uses_openai_embeddings else 0.0
        rows = await self.vector.similarity_search(
            db,
            embedding,
            org_id=org_id,
            top_k=settings.retrieval_top_k,
            min_score=min_score,
        )
        items: list[RagChunkItem] = []
        for chunk, score, document in rows:
            items.append(
                {
                    "chunk_id": chunk.id,
                    "document_id": document.id,
                    "content": chunk.content,
                    "document_name": document.filename,
                    "page_number": chunk.page_number,
                    "score": score,
                }
            )
        return items

    @staticmethod
    def _to_uuid(value: str | uuid.UUID | None) -> uuid.UUID | None:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))

    def _build_citation_models(self, raw: list[CitationRaw]) -> list[Citation]:
        citations: list[Citation] = []
        for c in raw:
            chunk_id = c.get("chunk_id")
            doc_id = c.get("document_id")
            doc_name = c.get("document_name") or "unknown"
            chunk_text = c.get("chunk_text") or ""
            citations.append(
                Citation(
                    chunk_id=self._to_uuid(chunk_id),
                    document_id=self._to_uuid(doc_id),
                    document_name=doc_name,
                    page_number=c.get("page_number"),
                    chunk_text=chunk_text,
                    excerpt=c.get("excerpt"),
                    exact_quote_highlight=c.get("exact_quote_highlight"),
                    citation_index=c.get("citation_index"),
                )
            )
        return citations

    async def _save_query_log(
        self,
        db: AsyncSession,
        *,
        query: str,
        answer: str,
        citations: list[Citation],
        user_id: uuid.UUID | None,
        org_id: uuid.UUID | None,
        latency_ms: int,
        session_id: str | None = None,
        model: str | None = None,
    ) -> None:
        log = QueryLog(
            user_id=user_id,
            org_id=org_id,
            session_id=session_id,
            query_text=query,
            answer_text=answer,
            cited_chunks=[c.model_dump(mode="json") for c in citations],
            cited_chunk_ids=[
                str(c.chunk_id) for c in citations if c.chunk_id is not None
            ],
            model=model or settings.openai_chat_model,
            latency_ms=latency_ms,
        )
        db.add(log)
        await db.commit()

    async def run(
        self,
        db: AsyncSession,
        query: str,
        *,
        user_id: uuid.UUID | None = None,
        org_id: uuid.UUID | None = None,
        session_id: str | None = None,
    ) -> QueryResponse:
        start = time.perf_counter()
        retrieved = await self._retrieve(db, query, org_id)
        chunk_items = as_graded_chunks(retrieved)
        final_state = await self.graph.ainvoke(
            {"query": query, "chunk_items": chunk_items}
        )
        answer = final_state.get("answer", "")
        citations = self._build_citation_models(final_state.get("citations", []))
        latency_ms = int((time.perf_counter() - start) * 1000)
        await self._save_query_log(
            db,
            query=query,
            answer=answer,
            citations=citations,
            user_id=user_id,
            org_id=org_id,
            latency_ms=latency_ms,
            session_id=session_id,
        )
        return QueryResponse(answer=answer, citations=citations, latency_ms=latency_ms)

    async def _pipeline_through_rerank(
        self, query: str, chunk_items: list[GradedRagChunkItem]
    ) -> KnowledgeState:
        state: KnowledgeState = {"query": query, "chunk_items": chunk_items}
        state.update(await self._parse_query(state))
        state.update(await self._grade_relevance(state))
        state.update(await self._rerank_chunks(state))
        state.update(await self._format_citations(state))
        return state

    async def run_stream(
        self,
        db: AsyncSession,
        query: str,
        *,
        user_id: uuid.UUID | None = None,
        org_id: uuid.UUID | None = None,
        session_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        start = time.perf_counter()
        retrieved = await self._retrieve(db, query, org_id)
        chunk_items = as_graded_chunks(retrieved)
        pipeline_state = await self._pipeline_through_rerank(query, chunk_items)
        items = pipeline_state.get("chunk_items", [])
        context = format_rag_context(items) if items else ""
        citations = self._build_citation_models(pipeline_state.get("citations", []))

        raw_answer = ""
        async for token in self.llm.stream_answer(query, context):
            raw_answer += token
            yield json.dumps({"type": "token", "content": token}) + "\n"

        clean_answer, parsed_raw = parse_knowledge_answer(raw_answer, items)
        citations = self._build_citation_models(parsed_raw or pipeline_state.get("citations", []))

        latency_ms = int((time.perf_counter() - start) * 1000)
        await self._save_query_log(
            db,
            query=query,
            answer=clean_answer,
            citations=citations,
            user_id=user_id,
            org_id=org_id,
            latency_ms=latency_ms,
            session_id=session_id,
        )
        done: StreamDoneEvent = {
            "type": "done",
            "answer": clean_answer,
            "citations": [citation_to_json(c) for c in citations],
            "latency_ms": latency_ms,
        }
        yield json.dumps(done) + "\n"
