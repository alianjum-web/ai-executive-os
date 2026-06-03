import type { Citation } from "@/lib/api";

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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {citations && citations.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-zinc-200/50 pt-2 text-xs">
            {citations.map((c, i) => (
              <li key={i}>
                <strong>{c.document_name}</strong>
                {c.page_number ? ` · p.${c.page_number}` : ""} — {c.excerpt}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
