import { Sparkles } from "lucide-react";
import { Logo } from "@/common/atoms/Logo";

type AuthMarketingPanelProps = {
  headline: string;
  description: string;
};

export function AuthMarketingPanel({
  headline,
  description,
}: AuthMarketingPanelProps) {
  return (
    <section className="hidden w-1/2 flex-col justify-center border-r border-border px-12 xl:px-16 lg:flex">
      <Logo showWordmark size="lg" href="/welcome" />
      <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-foreground xl:text-4xl">
        {headline}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground xl:text-lg">
        {description}
      </p>
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-accent-ai" aria-hidden />
        <span>Calm · Focused · In control</span>
      </div>
    </section>
  );
}
