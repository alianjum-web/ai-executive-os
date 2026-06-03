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
    chunk_id: uuid.UUID | None = None
    document_name: str
    page_number: int | None = None
    chunk_text: str
    excerpt: str | None = None


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    latency_ms: int | None = None
    cached: bool = False


class QueryRatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class TicketResponse(BaseModel):
    id: uuid.UUID
    source: str
    intent: str | None
    priority: int | None
    summary: str | None
    department: str | None
    status: str
    assignee_email: str | None = None
    assignee_id: uuid.UUID | None = None
    slack_channel_id: str | None = None
    external_ticket_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogEntry(BaseModel):
    id: uuid.UUID
    action: str
    resource_type: str
    user_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketDetailResponse(TicketResponse):
    raw_payload: dict | None = None
    jira_url: str | None = None
    audit_timeline: list[ActivityLogEntry] = []


class AnalyticsDashboard(BaseModel):
    queries_today: int
    latency_p50_ms: int | None
    latency_p95_ms: int | None
    documents_indexed: int
    top_questions: list[dict]


class HistogramBucket(BaseModel):
    bucket: str
    count: int


class AdvancedAnalyticsDashboard(AnalyticsDashboard):
    query_volume_by_day: list[dict] = []
    latency_histogram: list[HistogramBucket] = []
    ticket_resolution_histogram: list[HistogramBucket] = []
    agent_accuracy_score: float | None = None
    rated_queries_count: int = 0
    period_days: int = 30
