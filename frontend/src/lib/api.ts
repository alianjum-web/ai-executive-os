import { getAuthHeaders } from "@/lib/auth-headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type DocumentRecord = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  chunk_id?: string;
  document_name: string;
  page_number: number | null;
  chunk_text: string;
  excerpt?: string | null;
};

export type QueryResult = {
  answer: string;
  citations: Citation[];
  latency_ms: number | null;
  cached?: boolean;
};

export type AnalyticsDashboard = {
  queries_today: number;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  documents_indexed: number;
  top_questions: { question: string; count: number }[];
};

export type HistogramBucket = { bucket: string; count: number };

export type AdvancedAnalyticsDashboard = AnalyticsDashboard & {
  query_volume_by_day: { date: string; count: number }[];
  latency_histogram: HistogramBucket[];
  ticket_resolution_histogram: HistogramBucket[];
  agent_accuracy_score: number | null;
  rated_queries_count: number;
  period_days: number;
};

export type TicketRecord = {
  id: string;
  source: string;
  intent: string | null;
  priority: number | null;
  summary: string | null;
  department: string | null;
  status: string;
  assignee_email: string | null;
  assignee_id: string | null;
  slack_channel_id: string | null;
  external_ticket_id: string | null;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  action: string;
  resource_type: string;
  user_id: string | null;
  created_at: string;
};

export type TicketDetail = TicketRecord & {
  raw_payload: Record<string, unknown> | null;
  jira_url: string | null;
  audit_timeline: ActivityLogEntry[];
};

export type IntegrationSettings = {
  jira_site_url: string | null;
  jira_project_key: string | null;
  sendgrid_from_email: string | null;
  inbound_email_address: string | null;
  has_jira_credentials: boolean;
  has_sendgrid_credentials: boolean;
  webhook_slack_url: string;
  webhook_email_url: string;
};

export type IntegrationSettingsUpdate = {
  jira_site_url?: string | null;
  jira_project_key?: string | null;
  jira_client_id?: string | null;
  jira_client_secret?: string | null;
  jira_access_token?: string | null;
  jira_refresh_token?: string | null;
  sendgrid_api_key?: string | null;
  sendgrid_from_email?: string | null;
  inbound_email_address?: string | null;
};

async function authFetch(url: string, init?: RequestInit) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

export async function uploadDocument(file: File): Promise<{
  document_id: string;
  status: string;
  message: string;
}> {
  const headers = await getAuthHeaders();
  delete headers["Content-Type"];
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await authFetch(`${API_BASE}/documents`, { cache: "no-store" });
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await res.text());
  }
}

export async function queryKnowledge(query: string): Promise<QueryResult> {
  const res = await authFetch(`${API_BASE}/query`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsDashboard> {
  const res = await authFetch(`${API_BASE}/analytics/dashboard`, {
    cache: "no-store",
  });
  return res.json();
}

export async function fetchAdvancedAnalytics(
  days = 30
): Promise<AdvancedAnalyticsDashboard> {
  const res = await authFetch(`${API_BASE}/analytics/advanced?days=${days}`, {
    cache: "no-store",
  });
  return res.json();
}

async function downloadCsv(path: string, filename: string) {
  const res = await authFetch(`${API_BASE}${path}`, { cache: "no-store" });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportQueriesCsv(): Promise<void> {
  await downloadCsv("/export/queries.csv", "queries.csv");
}

export async function exportTicketsCsv(): Promise<void> {
  await downloadCsv("/export/tickets.csv", "tickets.csv");
}

export async function listTickets(): Promise<TicketRecord[]> {
  const res = await authFetch(`${API_BASE}/tickets`, { cache: "no-store" });
  return res.json();
}

export async function getTicket(ticketId: string): Promise<TicketDetail> {
  const res = await authFetch(`${API_BASE}/tickets/${ticketId}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  const res = await authFetch(`${API_BASE}/settings/integrations`, {
    cache: "no-store",
  });
  return res.json();
}

export async function saveIntegrationSettings(
  body: IntegrationSettingsUpdate
): Promise<IntegrationSettings> {
  const res = await authFetch(`${API_BASE}/settings/integrations`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.json();
}
