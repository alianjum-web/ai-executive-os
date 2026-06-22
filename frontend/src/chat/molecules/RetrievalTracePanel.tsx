"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { RetrievalTrace } from "@/common/types";
import { cn } from "@/common/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  retrieved: "Retrieved",
  graded: "After relevance grade",
  reranked: "After rerank",
};

export function RetrievalTracePanel({ trace }: { trace: RetrievalTrace }) {
  const [open, setOpen] = useState(false);
  const stages = ["retrieved", "graded", "reranked"] as const;

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <Search className="h-3.5 w-3.5 shrink-0 text-accent-ai" aria-hidden />
        <span>Sources considered ({trace.candidates.length})</span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {trace.expanded_queries.length > 1 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Query expansion
              </p>
              <ul className="mt-1 space-y-1 text-xs text-foreground">
                {trace.expanded_queries.map((q) => (
                  <li key={q} className="rounded bg-muted/50 px-2 py-1">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {stages.map((stage) => {
            const rows = trace.candidates.filter((c) => c.stage === stage);
            if (!rows.length) return null;
            return (
              <div key={stage}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {STAGE_LABELS[stage] ?? stage}
                </p>
                <ul className="mt-1 space-y-1.5">
                  {rows.map((row, i) => (
                    <li
                      key={`${row.chunk_id ?? row.document_name}-${i}`}
                      className="rounded border border-border-subtle bg-card px-2 py-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-foreground">
                          {row.document_name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.score != null ? row.score.toFixed(2) : "—"}
                          {row.grade != null ? ` · g${row.grade}` : ""}
                        </span>
                      </div>
                      {row.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {row.excerpt}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
