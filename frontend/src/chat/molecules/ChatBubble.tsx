"use client";

import type { Citation } from "@/common/api/client";
import { AnswerWithCitations } from "@/chat/molecules/AnswerWithCitations";
import { cn } from "@/common/lib/utils";

export function ChatBubble({
  role,
  content,
  citations,
  selectedCitationKey,
  onSelectCitation,
}: {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  selectedCitationKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[linear-gradient(135deg,var(--accent-blue)_0%,var(--accent-ai)_100%)] text-white shadow-md"
            : "border border-border bg-card text-card-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content || "…"}</p>
        ) : (
          <AnswerWithCitations
            content={content}
            citations={citations}
            selectedKey={selectedCitationKey}
            onSelectCitation={onSelectCitation}
          />
        )}
        {!isUser && citations && citations.length > 0 ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {citations.length} source{citations.length === 1 ? "" : "s"} in the
            panel →
          </p>
        ) : null}
      </div>
    </div>
  );
}
