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
  allowed_departments?: string[] | null;
  allowed_roles?: string[] | null;
  source_connector?: string | null;
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

export type RetrievalCandidate = {
  document_name: string;
  chunk_id?: string | null;
  score?: number | null;
  grade?: number | null;
  stage: string;
  excerpt?: string | null;
};

export type RetrievalTrace = {
  original_query: string;
  expanded_queries: string[];
  candidates: RetrievalCandidate[];
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
  latency_ms: number | null;
  confidence_score?: number | null;
  escalated?: boolean;
  escalation_ticket_id?: string | null;
  query_log_id?: string | null;
  retrieval_trace?: RetrievalTrace | null;
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
  requires_approval?: boolean;
  approval_status?: string;
  external_ticket_id?: string | null;
  due_at?: string | null;
  created_at: string;
};

export type ExecutiveSummary = {
  total_queries: number;
  queries_today: number;
  automated_queries: number;
  escalated_queries: number;
  estimated_hours_saved: number;
  automation_rate_pct: number;
  escalation_rate_pct: number;
  documents_ready: number;
  open_tickets: number;
  low_confidence_unanswered: number;
  knowledge_gaps: TopQuestionRow[];
  department_scope?: string | null;
};

export type UnansweredQuestionsReport = {
  escalated: TopQuestionRow[];
  low_confidence: TopQuestionRow[];
  negative_feedback: TopQuestionRow[];
  total_gaps: number;
};

export type DemoSeedResponse = {
  documents_queued: number;
  sample_queries: number;
  sample_tickets: number;
  message: string;
};

export type EvaluationMetrics = {
  total_queries: number;
  escalated_queries: number;
  low_confidence_queries: number;
  positive_feedback: number;
  negative_feedback: number;
  accuracy_pct: number | null;
  escalation_rate_pct: number;
  avg_confidence_pct: number | null;
  unanswered_questions: TopQuestionRow[];
};

export type HarnessCaseResult = {
  id: string;
  question: string;
  passed: boolean;
  answer_preview: string;
  confidence_score?: number | null;
  escalated?: boolean;
  checks?: Record<string, boolean>;
};

export type HarnessRunResponse = {
  total_cases: number;
  passed: number;
  failed: number;
  accuracy_pct: number;
  results: HarnessCaseResult[];
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
