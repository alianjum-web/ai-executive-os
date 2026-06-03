import time
import uuid
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.database import Document, DocumentChunk, QueryLog
from app.models.schemas import Citation, QueryResponse
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.vector_service import VectorService


class KnowledgeState(TypedDict):
    query: str
    user_id: uuid.UUID | None
    parsed_query: str
    chunks: list
    context: str
    answer: str
    citations: list[dict]
    latency_ms: int


class KnowledgeAgent:
    def __init__(self) -> None:
        self.embedder = EmbeddingService()
        self.llm = LLMService()
        self.vector = VectorService()
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(KnowledgeState)
        workflow.add_node("parse_query", self._parse_query)
        workflow.add_node("retrieve_chunks", self._retrieve_chunks)
        workflow.add_node("generate_answer", self._generate_answer)
        workflow.add_node("format_citations", self._format_citations)
        workflow.set_entry_point("parse_query")
        workflow.add_edge("parse_query", "retrieve_chunks")
        workflow.add_edge("retrieve_chunks", "generate_answer")
        workflow.add_edge("generate_answer", "format_citations")
        workflow.add_edge("format_citations", END)
        return workflow.compile()

    async def _parse_query(self, state: KnowledgeState) -> dict:
        return {"parsed_query": state["query"].strip()}

    async def _retrieve_chunks(self, state: KnowledgeState) -> dict:
        return {"chunks": [], "context": ""}

    async def _generate_answer(self, state: KnowledgeState) -> dict:
        if not state.get("context"):
            return {
                "answer": (
                    "I don't have enough information in the knowledge base to answer "
                    "that question."
                )
            }
        answer = await self.llm.generate_answer(state["parsed_query"], state["context"])
        return {"answer": answer}

    async def _format_citations(self, state: KnowledgeState) -> dict:
        return {"citations": state.get("citations", [])}

    async def run(
        self, db: AsyncSession, query: str, user_id: uuid.UUID | None = None
    ) -> QueryResponse:
        start = time.perf_counter()
        embedding = await self.embedder.embed(query)
        retrieved = await self.vector.similarity_search(
            db, embedding, top_k=settings.retrieval_top_k
        )

        chunks: list = []
        context_parts: list[str] = []
        citations: list[Citation] = []

        for chunk, score in retrieved:
            doc_result = await db.execute(
                select(Document)
                .where(Document.id == chunk.document_id)
                .options(selectinload(Document.chunks))
            )
            document = doc_result.scalar_one()
            chunks.append((chunk, score, document))
            context_parts.append(chunk.content)
            citations.append(
                Citation(
                    document_name=document.filename,
                    page_number=chunk.page_number,
                    excerpt=chunk.content[:200],
                )
            )

        context = "\n\n---\n\n".join(context_parts)
        if not context.strip():
            latency_ms = int((time.perf_counter() - start) * 1000)
            answer = (
                "I don't have enough information in the knowledge base to answer "
                "that question."
            )
            log = QueryLog(
                user_id=user_id,
                query_text=query,
                answer_text=answer,
                cited_chunks=[],
                latency_ms=latency_ms,
            )
            db.add(log)
            await db.commit()
            return QueryResponse(answer=answer, citations=[], latency_ms=latency_ms)

        answer = await self.llm.generate_answer(query, context)
        latency_ms = int((time.perf_counter() - start) * 1000)

        log = QueryLog(
            user_id=user_id,
            query_text=query,
            answer_text=answer,
            cited_chunks=[c.model_dump() for c in citations],
            latency_ms=latency_ms,
        )
        db.add(log)
        await db.commit()

        return QueryResponse(answer=answer, citations=citations, latency_ms=latency_ms)
