"use client";

import { useCallback, useRef } from "react";
import { getAuthHeaders } from "@/lib/auth-headers";
import type { Citation, QueryResult } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export function useQueryStream() {
  const abortRef = useRef<AbortController | null>(null);

  const streamQuery = useCallback(
    async (
      query: string,
      onToken: (accumulated: string) => void
    ): Promise<QueryResult> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/query/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let result: QueryResult = { answer: "", citations: [], latency_ms: null };

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
          try {
            const event = JSON.parse(payload) as {
              type: string;
              content?: string;
              answer?: string;
              citations?: Citation[];
              latency_ms?: number;
            };
            if (event.type === "token" && event.content) {
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
          } catch {
            // ignore malformed SSE chunks
          }
        }
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
