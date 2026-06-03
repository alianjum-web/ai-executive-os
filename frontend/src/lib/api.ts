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
};

export type AnalyticsDashboard = {
  queries_today: number;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  documents_indexed: number;
  top_questions: { question: string; count: number }[];
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
