import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.chunking_service import ChunkingService
from app.services.document_parser import DocumentParser


@pytest.mark.asyncio
async def test_pdf_extraction_has_page_numbers(tmp_path):
    import fitz

    pdf_path = tmp_path / "sample.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Vacation policy: 20 days PTO.")
    doc.save(str(pdf_path))
    doc.close()

    pages = DocumentParser().extract_text(pdf_path)
    assert len(pages) >= 1
    assert "PTO" in pages[0][0]
    assert pages[0][1] == 1


def test_langchain_chunking_respects_max_tokens():
    service = ChunkingService(max_tokens=800)
    text = "Word " * 5000
    chunks = service.chunk_text(text, page_number=1, start_index=0)
    assert len(chunks) > 1
    for chunk in chunks:
        assert service.count_tokens(chunk.content) <= 800


@pytest.mark.asyncio
async def test_ingest_enqueues_processing(client):
    doc_id = uuid.uuid4()
    mock_doc = MagicMock()
    mock_doc.id = doc_id
    mock_doc.status = "pending"
    with patch("app.api.v1.routers.ingest.DocumentService") as mock_service_cls, patch(
        "app.api.v1.routers.ingest.process_document_task"
    ) as mock_task:
        mock_service_cls.return_value.save_upload = AsyncMock(return_value=mock_doc)
        mock_task.delay = MagicMock()
        headers = {
            "X-Org-Id": str(uuid.uuid4()),
            "X-User-Id": str(uuid.uuid4()),
            "X-User-Role": "admin",
        }
        files = {"file": ("policy.md", b"# PTO\n\n20 days per year.", "text/markdown")}
        response = await client.post("/api/v1/ingest", files=files, headers=headers)

    assert response.status_code == 202
    mock_task.delay.assert_called_once_with(str(doc_id))


@pytest.mark.asyncio
async def test_embed_many_batches():
    from app.services.embedding_service import EmbeddingService

    service = EmbeddingService()
    with patch.object(service, "_client", None):
        vectors = await service.embed_many(["a", "b", "c"], batch_size=2)
    assert len(vectors) == 3
    assert len(vectors[0]) == 1536
