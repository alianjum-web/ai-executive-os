import {
  BookOpen,
  CircuitBoard,
  FileSearch,
  GitBranch,
  MessageSquare,
  Ticket,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Two-agent OS",
    description:
      "Ask questions and auto-route work — knowledge Q&A and ticket routing in one platform.",
  },
  {
    icon: MessageSquare,
    title: "AI knowledge assistant",
    description:
      "Citation-grade answers with chunk preview — every response is auditable.",
  },
  {
    icon: FileSearch,
    title: "Retrieval transparency",
    description:
      "See query expansion, grading, and rerank — sources considered are visible in chat.",
  },
  {
    icon: BookOpen,
    title: "Department-scoped docs",
    description:
      "HR vs engineering access controls — mid-size teams keep sensitive docs isolated.",
  },
  {
    icon: Ticket,
    title: "Workload-aware routing",
    description:
      "Smarter than round-robin — tickets land on the teammate with the lightest load.",
  },
  {
    icon: CircuitBoard,
    title: "Resilient AI stack",
    description:
      "Circuit breaker and heuristics fallback keep answers flowing when providers rate-limit.",
  },
] as const;

export function WelcomeFeatureGrid() {
  return (
    <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-base font-semibold text-foreground">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
