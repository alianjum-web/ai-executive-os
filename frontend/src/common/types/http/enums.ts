/** Mirrors backend `app/models/enums.py` — keep in sync with API Literal types. */

export type AiProviderId = "openai" | "anthropic" | "gemini" | "groq";
export type UserRole = "admin" | "manager" | "employee";
export type DocumentStatus = "pending" | "processing" | "ready" | "error";
export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "pending_approval";
export type TicketSource = "slack" | "manual" | "api";

export const DOCUMENT_PROCESSING_STATUSES: readonly DocumentStatus[] = [
  "pending",
  "processing",
] as const;

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "ready" ||
    value === "error"
  );
}

export function isDocumentProcessing(status: DocumentStatus): boolean {
  return DOCUMENT_PROCESSING_STATUSES.includes(status);
}

export function isTicketStatus(value: string): value is TicketStatus {
  return (
    value === "open" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "closed" ||
    value === "pending_approval"
  );
}

export function isTicketSource(value: string): value is TicketSource {
  return value === "slack" || value === "manual" || value === "api";
}
