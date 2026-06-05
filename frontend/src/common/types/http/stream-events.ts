/** Mirrors backend `app/models/http/stream.py` (SSE `data:` JSON lines). */

import type { Citation } from "@/common/types/http/schemas";

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
      };
    }
    return null;
  } catch {
    return null;
  }
}
