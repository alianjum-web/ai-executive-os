import json
import time
import uuid
from collections.abc import AsyncGenerator
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.database import QueryLog
from app.models.schemas import Citation, QueryResponse
from app.services.embedding_service import EmbeddingService
from app.services.grading_service import GradingService
from app.services.llm_service import LLMService
from app.services.rerank_service import RerankService
from app.services.vector_service import VectorService


class KnowledgeState(TypedDict, total=False):
    query: str
    parsed_query: str
    chunk_items: list[dict]
    context: str
    answer: str
    citations: list[dict]


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

    async def _parse_query(self, state: KnowledgeState) -> dict:
        return {"parsed_query": state["query"].strip()}

    async def _grade_relevance(self, state: KnowledgeState) -> dict:
        graded = await self.grader.filter_chunks(
            state["parsed_query"],
            list(state.get("chunk_items", [])),
            min_grade=settings.min_relevance_grade,
        )
        return {"chunk_items": graded}

    async def _rerank_chunks(self, state: KnowledgeState) -> dict:
        reranked = await self.reranker.rerank(
            state["parsed_query"],
            list(state.get("chunk_items", [])),
            top_n=settings.rerank_top_k,
        )
        return {"chunk_items": reranked}

    async def _generate_answer(self, state: KnowledgeState) -> dict:
        items = state.get("chunk_items", [])
        if not items:
            return {
                "answer": (
                    "I don't have enough information in the knowledge base to answer "
                    "that question."
                ),
                "context": "",
            }
        context = "\n\n---\n\n".join(i["content"] for i in items)
        answer = await self.llm.generate_answer(state["parsed_query"], context)
        return {"answer": answer, "context": context}

    async def _format_citations(self, state: KnowledgeState) -> dict:
        citations = []
        for item in state.get("chunk_items", []):
            citations.append(
                {
                    "chunk_id": str(item["chunk_id"]),
                    "document_name": item["document_name"],
                    "page_number": item.get("page_number"),
                    "chunk_text": item["content"],
                    "excerpt": item["content"][:200],
                }
            )
        return {"citations": citations}

    async def _retrieve(
        self, db: AsyncSession, query: str, org_id: uuid.UUID | None
    ) -> list[dict]:
        embedding = await self.embedder.embed(query)
        rows = await self.vector.similarity_search(
            db,
            embedding,
            org_id=org_id,
            top_k=settings.retrieval_top_k,
        )
        items: list[dict] = []
        for chunk, score, document in rows:
            items.append(
                {
                    "chunk_id": chunk.id,
                    "content": chunk.content,
                    "document_name": document.filename,
                    "page_number": chunk.page_number,
                    "score": score,
                }
            )
        return items

    def _build_citation_models(self, raw: list[dict]) -> list[Citation]:
        return [
            Citation(
                chunk_id=uuid.UUID(c["chunk_id"]) if c.get("chunk_id") else None,
                document_name=c["document_name"],
                page_number=c.get("page_number"),
                chunk_text=c["chunk_text"],
                excerpt=c.get("excerpt"),
            )
            for c in raw
        ]

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
        chunk_items = await self._retrieve(db, query, org_id)
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

    async def _pipeline_through_rerank(self, query: str, chunk_items: list[dict]) -> KnowledgeState:
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
        chunk_items = await self._retrieve(db, query, org_id)
        pipeline_state = await self._pipeline_through_rerank(query, chunk_items)
        items = pipeline_state.get("chunk_items", [])
        context = "\n\n---\n\n".join(i["content"] for i in items) if items else ""
        citations = self._build_citation_models(pipeline_state.get("citations", []))

        full_answer = ""
        async for token in self.llm.stream_answer(query, context):
            full_answer += token
            yield json.dumps({"type": "token", "content": token}) + "\n"

        latency_ms = int((time.perf_counter() - start) * 1000)
        await self._save_query_log(
            db,
            query=query,
            answer=full_answer,
            citations=citations,
            user_id=user_id,
            org_id=org_id,
            latency_ms=latency_ms,
            session_id=session_id,
        )
        yield json.dumps(
            {
                "type": "done",
                "answer": full_answer,
                "citations": [c.model_dump(mode="json") for c in citations],
                "latency_ms": latency_ms,
            }
        ) + "\n"
