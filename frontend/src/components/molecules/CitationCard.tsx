import type { Citation } from "@/lib/api";

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-900">
        <span>{citation.document_name}</span>
        {citation.page_number != null ? (
          <span className="rounded bg-amber-200/60 px-1.5 py-0.5">
            Page {citation.page_number}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap rounded bg-white/70 p-2 text-zinc-800 leading-relaxed">
        {citation.chunk_text}
      </p>
    </div>
  );
}
