import type { Citation } from "@/lib/api";
import { CitationCard } from "@/components/molecules/CitationCard";

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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
          isUser ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{content || "…"}</p>
        {citations && citations.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
