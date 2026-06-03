import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IngestResponse(BaseModel):
    document_id: uuid.UUID
    status: str = "pending"
    message: str = "Document queued for processing"


class Citation(BaseModel):
    document_name: str
    page_number: int | None = None
    excerpt: str


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_id: uuid.UUID | None = None


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    latency_ms: int | None = None
