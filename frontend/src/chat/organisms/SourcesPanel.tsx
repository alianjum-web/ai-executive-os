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
    if (!documentId) {
      setBlobUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(documentFileUrl(documentId), { headers });
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
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [documentId]);

  return { blobUrl, error };
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
  onClose?: () => void;
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
        "flex min-h-0 flex-col border-t border-border bg-card lg:border-l lg:border-t-0",
        className
      )}
      aria-label="Sources and PDF preview"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Sources</h3>
          <p className="text-xs text-muted-foreground">
            Click inline markers or a source to preview
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close sources panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <ul className="max-h-36 shrink-0 space-y-1 overflow-y-auto border-b border-border px-2 py-2 lg:max-h-44">
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
                    : "hover:bg-muted/80 text-muted-foreground"
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
                <span className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                  {c.exact_quote_highlight ?? c.excerpt ?? c.chunk_text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {active ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Highlighted passage
            </p>
            <mark className="mt-2 block rounded-lg border border-accent-ai/30 bg-accent-ai/10 px-3 py-2 text-sm leading-relaxed text-foreground">
              {highlight || "No quote available for this source."}
            </mark>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Document preview
            </p>
            {blobUrl ? (
              <iframe
                title={`PDF: ${active.document_name}`}
                src={blobUrl}
                className="min-h-[240px] flex-1 rounded-lg border border-border bg-muted/20"
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                {pdfError ?? "Loading PDF…"}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
