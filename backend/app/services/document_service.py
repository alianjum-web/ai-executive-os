import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import ActivityLog, Document, DocumentChunk, User
from app.services.chunking_service import ChunkingService, TextChunk
from app.services.document_parser import DocumentParser
from app.services.embedding_service import EmbeddingService
from app.services.storage_service import StorageService
from app.services.vector_service import VectorService


class DocumentService:
    def __init__(self) -> None:
        self.parser = DocumentParser()
        self.chunker = ChunkingService()
        self.embedder = EmbeddingService()
        self.vector = VectorService()
        self.storage = StorageService()

    async def save_upload(
        self,
        db: AsyncSession,
        file: UploadFile,
        *,
        user_id: uuid.UUID | None = None,
        org_id: uuid.UUID | None = None,
    ) -> Document:
        doc_id = uuid.uuid4()
        content = await file.read()
        storage_path = self.storage.save_bytes(
            content,
            document_id=doc_id,
            filename=file.filename or "unknown",
        )

        document = Document(
            id=doc_id,
            user_id=user_id,
            org_id=org_id,
            filename=file.filename or "unknown",
            storage_path=storage_path,
            status="pending",
        )
        db.add(document)
        await self._log_activity(
            db,
            user_id=user_id,
            org_id=org_id,
            action="document.upload",
            resource_type="document",
            resource_id=document.id,
        )
        await db.commit()
        await db.refresh(document)
        return document

    async def process_document(self, db: AsyncSession, document_id: uuid.UUID) -> None:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if not document:
            raise ValueError(f"Document {document_id} not found")

        document.status = "processing"
        await db.commit()

        try:
            read_path = self.storage.resolve_read_path(document.storage_path)
            pages = self.parser.extract_text(read_path)

            all_chunks: list[TextChunk] = []
            next_index = 0
            for page_text, page_num in pages:
                page_chunks = self.chunker.chunk_text(
                    page_text, page_number=page_num, start_index=next_index
                )
                all_chunks.extend(page_chunks)
                if page_chunks:
                    next_index = page_chunks[-1].chunk_index + 1

            if not all_chunks:
                raise ValueError("No text extracted from document")

            texts = [c.content for c in all_chunks]
            embeddings = await self.embedder.embed_many(texts)

            db_chunks: list[DocumentChunk] = []
            for chunk, embedding in zip(all_chunks, embeddings, strict=True):
                db_chunks.append(
                    DocumentChunk(
                        document_id=document.id,
                        content=chunk.content,
                        chunk_index=chunk.chunk_index,
                        page_number=chunk.page_number,
                        embedding=embedding,
                    )
                )

            await self.vector.store_chunks(db, db_chunks)
            document.status = "ready"
        except Exception:
            document.status = "error"
            raise
        finally:
            await db.commit()

    async def list_documents(
        self, db: AsyncSession, org_id: uuid.UUID | None = None
    ) -> list[Document]:
        stmt = select(Document).order_by(Document.created_at.desc())
        if org_id is not None:
            stmt = stmt.where(Document.org_id == org_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def delete_document(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> bool:
        stmt = select(Document).where(Document.id == document_id)
        if org_id is not None:
            stmt = stmt.where(Document.org_id == org_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()
        if not document:
            return False

        if not document.storage_path.startswith("supabase:"):
            path = Path(document.storage_path)
            if path.exists():
                path.unlink()

        await db.execute(
            delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        await db.delete(document)
        await self._log_activity(
            db,
            user_id=user_id,
            org_id=org_id,
            action="document.delete",
            resource_type="document",
            resource_id=document_id,
        )
        await db.commit()
        return True

    async def _log_activity(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID | None,
        org_id: uuid.UUID | None,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID,
    ) -> None:
        db.add(
            ActivityLog(
                user_id=user_id,
                org_id=org_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        )

    async def ensure_default_user(self, db: AsyncSession) -> User:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if user:
            return user
        user = User(email="admin@example.com", role="admin")
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
