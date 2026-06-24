"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import type { Citation } from "@/common/types";
import { documentFileUrl } from "@/common/api/client";
import { getAuthHeaders } from "@/auth/services/headers";
import { citationKey } from "@/chat/lib/parseAssistantContent";
import { cn } from "@/common/lib/utils";

function usePdfBlobUrl(documentId: string | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let revoked: string | null = null;
    let cancelled = false;

    async function fetchPdf() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(documentFileUrl(documentId!), { headers });
        if (!res.ok) throw new Error("Could not load PDF");
        
        const blob = await res.blob();
        if (cancelled) return;

        revoked = URL.createObjectURL(blob);
        setBlobUrl(revoked);
        setError(null);
      } catch {
        if (!cancelled) {
          setBlobUrl(null);
          setError("PDF preview unavailable");
        }
      }
    }

    fetchPdf();

    return () => {
      cancelled = true;
      if (revoked) {
        URL.revokeObjectURL(revoked);
      }
    };
  }, [documentId]);

  return { blobUrl: documentId ? blobUrl : null, error: documentId ? error : null };
}

function displayDocName(name: string): string {
  return name.replace(/\.(pdf|docx?|txt)$/i, "").replace(/_/g, " ");
}

export function SourcesPanel({
  citations,
  selected,
  onSelect,
  onClose,
  className,
}: {
  citations: Citation[];
  selected: Citation | null;
  onSelect: (c: Citation) => void;
  onClose: () => void;
  className?: string;
}) {
  const active = selected ?? citations[0] ?? null;
  const highlight =
    active?.exact_quote_highlight?.trim() ||
    active?.excerpt?.trim() ||
    active?.chunk_text?.trim() ||
    "";
  const { blobUrl, error: pdfError } = usePdfBlobUrl(
    active?.document_id ?? undefined
  );

  if (!citations.length) return null;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-t border-border bg-card shadow-lg lg:border-l lg:border-t-0",
        className
      )}
      aria-label="Sources and PDF preview"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Source
          </p>
          <h3 className="truncate text-base font-semibold text-foreground">
            {active ? displayDocName(active.document_name) : "References"}
          </h3>
          {active?.page_number != null ? (
            <p className="text-xs text-muted-foreground">
              Page {active.page_number}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close sources panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {active ? (
        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">
            {highlight || "No excerpt available for this source."}
          </p>
          <button
            type="button"
            onClick={() => onSelect(active)}
            className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted"
          >
            <FileText className="h-3 w-3 shrink-0 text-accent-ai" aria-hidden />
            <span className="truncate">{active.document_name}</span>
            {citations.length > 1 ? (
              <span className="shrink-0 text-accent-ai">
                +{citations.length - 1}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {citations.length > 1 ? (
        <ul className="max-h-28 shrink-0 space-y-1 overflow-y-auto border-b border-border px-2 py-2">
          {citations.map((c, i) => {
            const key = citationKey(c);
            const isActive = active && citationKey(active) === key;
            return (
              <li key={key ?? i}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "bg-accent-ai/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold text-accent-ai">
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{c.document_name}</span>
                    {c.page_number != null ? (
                      <span className="shrink-0 rounded bg-accent-ai/10 px-1 py-0.5 text-[10px]">
                        p.{c.page_number}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {active ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Document preview
          </p>
          {blobUrl ? (
            <iframe
              title={`PDF: ${active.document_name}`}
              src={blobUrl}
              className="min-h-[280px] flex-1 rounded-lg border border-border bg-muted/20"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
              {pdfError ?? "Loading PDF…"}
            </p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
