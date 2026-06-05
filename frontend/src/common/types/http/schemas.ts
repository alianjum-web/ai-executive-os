/** Mirrors backend `app/models/http/schemas.py` (JSON field shapes). */

import type {
  DocumentStatus,
  TicketSource,
  TicketStatus,
  UserRole,
} from "@/common/types/http/enums";

export type DocumentRecord = {
  id: string;
  filename: string;
  status: DocumentStatus;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  page_count?: number | null;
  created_at: string;
  updated_at: string;
};

export type IngestResponse = {
  document_id: string;
  status: DocumentStatus;
  message: string;
};

export type Citation = {
  chunk_id?: string | null;
  document_id?: string | null;
  document_name: string;
  page_number: number | null;
  chunk_text: string;
  excerpt?: string | null;
  exact_quote_highlight?: string | null;
  citation_index?: number | null;
};

export type QueryRequest = {
  query: string;
  session_id?: string | null;
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
  latency_ms: number | null;
};

/** Alias used by chat hooks and slice. */
export type QueryResult = QueryResponse;

export type TopQuestionRow = {
  question: string;
  count: number;
};

export type AnalyticsDashboard = {
  queries_today: number;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  documents_indexed: number;
  top_questions: TopQuestionRow[];
};

export type TicketRecord = {
  id: string;
  source: TicketSource;
  title?: string | null;
  intent: string | null;
  priority: number | null;
  summary: string | null;
  department: string | null;
  status: TicketStatus;
  assignee_email: string | null;
  assignee_id: string | null;
  assignee_name?: string | null;
  slack_channel_id: string | null;
  due_at?: string | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  job_title?: string | null;
  role: UserRole;
  org_id?: string | null;
  department?: string | null;
  avatar_url?: string | null;
};
