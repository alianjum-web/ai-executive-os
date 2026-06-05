"use client";

import type { Citation } from "@/common/api/client";
import {
  citationKey,
  findCitationForSegment,
  parseAssistantContent,
  segmentAnswerText,
} from "@/chat/lib/parseAssistantContent";
import { cn } from "@/common/lib/utils";

export function AnswerWithCitations({
  content,
  citations = [],
  selectedKey,
  onSelectCitation,
}: {
  content: string;
  citations?: Citation[];
  selectedKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
}) {
  const { displayText } = parseAssistantContent(content);
  const segments = segmentAnswerText(displayText);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <p className="whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.type === "text") {
            return <span key={i}>{seg.value}</span>;
          }
          const matched = findCitationForSegment(citations, seg);
          const label =
            seg.type === "numeric"
              ? `[${seg.index}]`
              : `p.${seg.pageNumber ?? "?"}`;
          const key = matched ? citationKey(matched) : seg.raw;
          const isActive = selectedKey === key;
          return (
            <button
              key={i}
              type="button"
              onClick={() => matched && onSelectCitation?.(matched)}
              className={cn(
                "mx-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors",
                "border align-baseline",
                matched
                  ? "cursor-pointer border-accent-ai/40 bg-accent-ai/15 text-accent-ai hover:bg-accent-ai/25"
                  : "cursor-default border-border bg-muted text-muted-foreground",
                isActive && "ring-2 ring-accent-ai/50"
              )}
              title={
                matched
                  ? `${matched.document_name}${matched.page_number != null ? ` · page ${matched.page_number}` : ""}`
                  : seg.raw
              }
            >
              {label}
            </button>
          );
        })}
      </p>
    </div>
  );
}
