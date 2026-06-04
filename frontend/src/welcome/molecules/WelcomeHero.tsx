import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/common/atoms/ui/button";

export function WelcomeHero() {
  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-accent-blue">
        AI Executive OS
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        Your company knowledge,
        <br />
        one calm command center
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Citation-grounded answers from your SOPs, automated ticket routing, and
        analytics — built for teams that need accuracy, not guesswork.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" asChild>
          <Link href="/signup">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
