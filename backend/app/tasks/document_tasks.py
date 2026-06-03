import asyncio
import uuid

from app.core.database import AsyncSessionLocal
from app.services.document_service import DocumentService
from app.tasks.celery_app import celery_app


def _run_async(coro):
    return asyncio.run(coro)


@celery_app.task(name="process_document")
def process_document_task(document_id: str) -> str:
    async def _process():
        async with AsyncSessionLocal() as db:
            service = DocumentService()
            await service.process_document(db, uuid.UUID(document_id))

    _run_async(_process())
    return document_id
