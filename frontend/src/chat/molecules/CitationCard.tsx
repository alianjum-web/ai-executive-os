import type { Citation } from "@/common/services/api/client";

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="rounded-lg border border-accent-ai/25 bg-accent-ai/5 p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-accent-ai">
        <span>{citation.document_name}</span>
        {citation.page_number != null ? (
          <span className="rounded-md bg-accent-ai/15 px-1.5 py-0.5 text-[10px]">
            Page {citation.page_number}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap rounded-md bg-background/50 p-2 leading-relaxed text-foreground">
        {citation.chunk_text}
      </p>
    </div>
  );
}
