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
  document_name: string;
  page_number: number | null;
  excerpt: string;
};

export type QueryResult = {
  answer: string;
  citations: Citation[];
  latency_ms: number | null;
};

export async function uploadDocument(file: File): Promise<{
  document_id: string;
  status: string;
  message: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/ingest`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/documents`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryKnowledge(query: string): Promise<QueryResult> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryKnowledgeStream(
  query: string,
  onChunk: (text: string) => void
): Promise<QueryResult> {
  const result = await queryKnowledge(query);
  onChunk(result.answer);
  return result;
}
