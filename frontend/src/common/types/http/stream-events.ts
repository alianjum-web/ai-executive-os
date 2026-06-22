/** Mirrors backend `app/models/http/stream.py` (SSE `data:` JSON lines). */

import type { Citation, RetrievalTrace } from "@/common/types/http/schemas";

export type StreamTokenEvent = {
  type: "token";
  content: string;
};

export type StreamErrorEvent = {
  type: "error";
  message: string;
};

export type StreamDoneEvent = {
  type: "done";
  answer: string;
  citations: Citation[];
  latency_ms: number;
  confidence_score?: number;
  escalated?: boolean;
  escalation_ticket_id?: string | null;
  query_log_id?: string | null;
  retrieval_trace?: RetrievalTrace | null;
};

export type StreamSseEvent =
  | StreamTokenEvent
  | StreamErrorEvent
  | StreamDoneEvent;

export function parseStreamSseEvent(payload: string): StreamSseEvent | null {
  try {
    const raw: unknown = JSON.parse(payload);
    if (!raw || typeof raw !== "object") return null;
    const event = raw as Record<string, unknown>;
    const type = event.type;
    if (type === "token" && typeof event.content === "string") {
      return { type: "token", content: event.content };
    }
    if (type === "error" && typeof event.message === "string") {
      return { type: "error", message: event.message };
    }
    if (type === "done" && typeof event.answer === "string") {
      return {
        type: "done",
        answer: event.answer,
        citations: Array.isArray(event.citations)
          ? (event.citations as Citation[])
          : [],
        latency_ms:
          typeof event.latency_ms === "number" ? event.latency_ms : 0,
        confidence_score:
          typeof event.confidence_score === "number"
            ? event.confidence_score
            : undefined,
        escalated:
          typeof event.escalated === "boolean" ? event.escalated : undefined,
        escalation_ticket_id:
          typeof event.escalation_ticket_id === "string"
            ? event.escalation_ticket_id
            : null,
        query_log_id:
          typeof event.query_log_id === "string" ? event.query_log_id : null,
        retrieval_trace:
          event.retrieval_trace &&
          typeof event.retrieval_trace === "object" &&
          !Array.isArray(event.retrieval_trace)
            ? (event.retrieval_trace as RetrievalTrace)
            : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
