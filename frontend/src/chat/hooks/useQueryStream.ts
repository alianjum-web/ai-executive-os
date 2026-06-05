"use client";

import { useCallback, useRef } from "react";
import { getAuthHeaders } from "@/auth/services/headers";
import { apiErrorMessage } from "@/common/api/errors";
import { fetchWithTimeout } from "@/common/api/fetch";
import type { QueryResponse } from "@/common/types";
import { parseStreamSseEvent } from "@/common/types/http/stream-events";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
/** Chat can wait on retrieval + LLM longer than typical REST calls. */
const STREAM_TIMEOUT_MS = 120_000;

export function useQueryStream() {
  const abortRef = useRef<AbortController | null>(null);

  const streamQuery = useCallback(
    async (
      query: string,
      onToken: (accumulated: string) => void
    ): Promise<QueryResponse> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const headers = await getAuthHeaders();
      let res: Response;
      try {
        res = await fetchWithTimeout(
          `${API_BASE}/query/stream`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ query }),
            signal: abortRef.current.signal,
          },
          STREAM_TIMEOUT_MS
        );
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error("Request cancelled.");
        }
        throw e;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          apiErrorMessage(
            res.status,
            body,
            `Chat request failed (${res.status}). Is the backend running on port 8000?`
          )
        );
      }
      if (!res.body) throw new Error("No response body from chat API.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let result: QueryResponse = {
        answer: "",
        citations: [],
        latency_ms: null,
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.replace(/^data:\s*/, "").trim();
            if (!payload) continue;

            const event = parseStreamSseEvent(payload);
            if (!event) continue;

            if (event.type === "error") {
              throw new Error(event.message);
            }
            if (event.type === "token") {
              accumulated += event.content;
              onToken(accumulated);
            }
            if (event.type === "done") {
              result = {
                answer: event.answer ?? accumulated,
                citations: event.citations ?? [],
                latency_ms: event.latency_ms ?? null,
              };
            }
          }
        }
      } catch (streamErr) {
        if (accumulated.trim()) {
          return {
            answer: accumulated,
            citations: result.citations,
            latency_ms: result.latency_ms,
          };
        }
        if (streamErr instanceof TypeError) {
          throw new Error(
            "Lost connection to the API. Keep `npm run prod` running in backend/ and retry."
          );
        }
        throw streamErr;
      }

      if (!result.answer) {
        result.answer = accumulated;
      }
      return result;
    },
    []
  );

  return { streamQuery };
}
