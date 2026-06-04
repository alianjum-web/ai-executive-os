import type { Citation } from "@/common/services/api/client";
import { CitationCard } from "@/chat/molecules/CitationCard";
import { cn } from "@/common/lib/utils";

export function ChatBubble({
  role,
  content,
  citations,
}: {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
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
        <p className="whitespace-pre-wrap">{content || "…"}</p>
        {citations && citations.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isUser ? "text-white/75" : "text-muted-foreground"
              )}
            >
              Sources
            </p>
            {citations.map((c, i) => (
              <CitationCard key={c.chunk_id ?? i} citation={c} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
