import { BookOpen, MessageSquare, Ticket } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI knowledge assistant",
    description:
      "Ask questions grounded in your SOPs and policies with clear citations.",
  },
  {
    icon: BookOpen,
    title: "Document library",
    description:
      "Upload and index PDFs and docs so the whole team shares one source of truth.",
  },
  {
    icon: Ticket,
    title: "Smart ticket routing",
    description:
      "Route requests from Slack and email to the right owner automatically.",
  },
] as const;

export function WelcomeFeatureGrid() {
  return (
    <section className="mt-16 grid gap-6 sm:grid-cols-3">
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
