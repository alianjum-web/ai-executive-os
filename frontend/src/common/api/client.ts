import { getAuthHeaders } from "@/auth/services/headers";
import {
  ApiClientError,
  apiErrorMessage,
  parseApiErrorBody,
} from "@/common/api/errors";
import { fetchWithTimeout } from "@/common/api/fetch";
import type {
  AnalyticsDashboard,
  DocumentRecord,
  DemoSeedResponse,
  EvaluationMetrics,
  HarnessRunResponse,
  ExecutiveSummary,
  IngestResponse,
  UnansweredQuestionsReport,
  QueryRequest,
  QueryResponse,
  TicketRecord,
} from "@/common/types";

export type {
  AnalyticsDashboard,
  Citation,
  DocumentRecord,
  IngestResponse,
  QueryRequest,
  QueryResponse,
  QueryResult,
  TicketRecord,
  TopQuestionRow,
  UserProfile,
} from "@/common/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export function documentFileUrl(documentId: string): string {
  return `${API_BASE}/documents/${documentId}/file`;
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text();
    const message = apiErrorMessage(res.status, body, res.statusText);
    throw new ApiClientError(message, res.status, parseApiErrorBody(body));
  }
  return res;
}

export async function uploadDocument(
  file: File,
  options?: { allowedDepartments?: string; allowedRoles?: string }
): Promise<IngestResponse> {
  const headers = await getAuthHeaders();
  delete headers["Content-Type"];
  const form = new FormData();
  form.append("file", file);
  if (options?.allowedDepartments) {
    form.append("allowed_departments", options.allowedDepartments);
  }
  if (options?.allowedRoles) {
    form.append("allowed_roles", options.allowedRoles);
  }
  const res = await fetchWithTimeout(`${API_BASE}/ingest`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiClientError(
      apiErrorMessage(res.status, body, "Upload failed"),
      res.status,
      parseApiErrorBody(body)
    );
  }
  return parseJson<IngestResponse>(res);
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await authFetch(`${API_BASE}/documents`, { cache: "no-store" });
  return parseJson<DocumentRecord[]>(res);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE}/documents/${documentId}`, {
    method: "DELETE",
    headers,
  });
  if (res.status === 404) {
    return;
  }
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new ApiClientError(
      apiErrorMessage(res.status, body, res.statusText),
      res.status,
      parseApiErrorBody(body)
    );
  }
}

export async function queryKnowledge(
  query: string,
  sessionId?: string | null
): Promise<QueryResponse> {
  const body: QueryRequest = { query, session_id: sessionId ?? null };
  const res = await authFetch(`${API_BASE}/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseJson<QueryResponse>(res);
}

export async function fetchAnalytics(): Promise<AnalyticsDashboard> {
  const res = await authFetch(`${API_BASE}/analytics/dashboard`, {
    cache: "no-store",
  });
  return parseJson<AnalyticsDashboard>(res);
}

export async function listTickets(): Promise<TicketRecord[]> {
  const res = await authFetch(`${API_BASE}/tickets`, { cache: "no-store" });
  return parseJson<TicketRecord[]>(res);
}

export async function approveTicket(ticketId: string): Promise<TicketRecord> {
  const res = await authFetch(`${API_BASE}/tickets/${ticketId}/approve`, {
    method: "POST",
  });
  return parseJson<TicketRecord>(res);
}

export async function rejectTicket(ticketId: string): Promise<TicketRecord> {
  const res = await authFetch(`${API_BASE}/tickets/${ticketId}/reject`, {
    method: "POST",
  });
  return parseJson<TicketRecord>(res);
}

export async function fetchExecutiveSummary(): Promise<ExecutiveSummary> {
  const res = await authFetch(`${API_BASE}/analytics/executive-summary`, {
    cache: "no-store",
  });
  return parseJson(res);
}

export async function fetchUnansweredReport(): Promise<UnansweredQuestionsReport> {
  const res = await authFetch(`${API_BASE}/evaluation/unanswered`, {
    cache: "no-store",
  });
  return parseJson(res);
}

export async function seedDemoTenant(): Promise<DemoSeedResponse> {
  const res = await authFetch(`${API_BASE}/demo/seed`, { method: "POST" });
  return parseJson(res);
}

export async function escalateQueryToHuman(payload: {
  query: string;
  queryLogId?: string | null;
  confidenceScore?: number | null;
  answerPreview?: string | null;
}): Promise<{ escalated: boolean; escalation_ticket_id: string; message: string }> {
  const res = await authFetch(`${API_BASE}/query/escalate`, {
    method: "POST",
    body: JSON.stringify({
      query: payload.query,
      query_log_id: payload.queryLogId ?? null,
      confidence_score: payload.confidenceScore ?? null,
      answer_preview: payload.answerPreview ?? null,
    }),
  });
  return parseJson(res);
}

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  const res = await authFetch(`${API_BASE}/evaluation/metrics`, {
    cache: "no-store",
  });
  return parseJson<EvaluationMetrics>(res);
}

export async function runEvaluationHarness(): Promise<HarnessRunResponse> {
  const res = await authFetch(`${API_BASE}/evaluation/harness/run`, {
    method: "POST",
  });
  return parseJson<HarnessRunResponse>(res);
}

export async function saveIntegrationConfig(
  provider: string,
  config: Record<string, string>
): Promise<void> {
  await authFetch(`${API_BASE}/settings/integrations`, {
    method: "PUT",
    body: JSON.stringify({ provider, config }),
  });
}

export async function syncNotionPage(
  pageId: string,
  options?: { allowedDepartments?: string[]; allowedRoles?: string[] }
): Promise<IngestResponse> {
  const res = await authFetch(`${API_BASE}/connectors/notion/sync`, {
    method: "POST",
    body: JSON.stringify({
      page_id: pageId,
      allowed_departments: options?.allowedDepartments ?? null,
      allowed_roles: options?.allowedRoles ?? null,
    }),
  });
  return parseJson<IngestResponse>(res);
}

export async function updateDocumentAccess(
  documentId: string,
  access: { allowedDepartments?: string[] | null; allowedRoles?: string[] | null }
): Promise<DocumentRecord> {
  const res = await authFetch(`${API_BASE}/documents/${documentId}/access`, {
    method: "PATCH",
    body: JSON.stringify({
      allowed_departments: access.allowedDepartments ?? null,
      allowed_roles: access.allowedRoles ?? null,
    }),
  });
  return parseJson<DocumentRecord>(res);
}

export async function submitQueryFeedback(
  queryLogId: string,
  feedback: "positive" | "negative"
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(
    `${API_BASE}/queries/${queryLogId}/feedback`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ feedback }),
    }
  );
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new ApiClientError(
      apiErrorMessage(res.status, body, res.statusText),
      res.status,
      parseApiErrorBody(body)
    );
  }
}

export async function resyncAllConnectors(): Promise<void> {
  await authFetch(`${API_BASE}/connectors/resync-all`, { method: "POST" });
}

export async function syncGoogleDriveFile(
  fileId: string,
  options?: { allowedDepartments?: string[]; allowedRoles?: string[] }
): Promise<IngestResponse> {
  const res = await authFetch(`${API_BASE}/connectors/google-drive/sync`, {
    method: "POST",
    body: JSON.stringify({
      file_id: fileId,
      allowed_departments: options?.allowedDepartments ?? null,
      allowed_roles: options?.allowedRoles ?? null,
    }),
  });
  return parseJson<IngestResponse>(res);
}
