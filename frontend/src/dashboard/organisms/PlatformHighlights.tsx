import {
  Bot,
  CircuitBoard,
  FileSearch,
  GitBranch,
  Scale,
  ShieldCheck,
} from "lucide-react";

const highlights = [
  {
    icon: GitBranch,
    title: "Two-agent OS",
    pitch: "Ask questions and auto-route work — one platform",
  },
  {
    icon: CircuitBoard,
    title: "Circuit breaker + heuristics",
    pitch: "Keeps working when OpenAI/Gemini rate-limits",
  },
  {
    icon: FileSearch,
    title: "Citation-grade answers",
    pitch: "Every answer is auditable with chunk preview",
  },
  {
    icon: Scale,
    title: "Workload-aware assignment",
    pitch: "Smarter than round-robin ticket routing",
  },
  {
    icon: ShieldCheck,
    title: "Manager approval gate",
    pitch: "AI suggests tickets — leadership approves before Jira",
  },
  {
    icon: Bot,
    title: "Retrieval transparency",
    pitch: "Query expansion and rerank visible in chat",
  },
] as const;

export function PlatformHighlights() {
  return (
    <section className="space-y-4" aria-label="Platform capabilities">
      <div>
        <h2 className="font-display text-lg font-semibold">Platform capabilities</h2>
        <p className="text-sm text-muted-foreground">
          Enterprise-grade AI operations — portfolio headlines
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-ai/10 text-accent-ai">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.pitch}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
