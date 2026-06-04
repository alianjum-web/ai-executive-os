import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    mime_type: str | None = None
    file_size_bytes: int | None = None
    page_count: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IngestResponse(BaseModel):
    document_id: uuid.UUID
    status: str = "pending"
    message: str = "Document queued for processing"


class Citation(BaseModel):
    chunk_id: uuid.UUID | None = None
    document_name: str
    page_number: int | None = None
    chunk_text: str
    excerpt: str | None = None


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    session_id: str | None = Field(default=None, max_length=64)


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    latency_ms: int | None = None


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None = None
    job_title: str | None = None
    role: str
    org_id: uuid.UUID | None = None
    department: str | None = None
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class TicketResponse(BaseModel):
    id: uuid.UUID
    source: str
    title: str | None = None
    intent: str | None
    priority: int | None
    summary: str | None
    department: str | None
    status: str
    assignee_email: str | None = None
    assignee_id: uuid.UUID | None = None
    assignee_name: str | None = None
    slack_channel_id: str | None = None
    due_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalyticsDashboard(BaseModel):
    queries_today: int
    latency_p50_ms: int | None
    latency_p95_ms: int | None
    documents_indexed: int
    top_questions: list[dict]
