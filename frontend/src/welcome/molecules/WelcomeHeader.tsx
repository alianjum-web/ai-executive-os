import Link from "next/link";
import { Logo } from "@/common/atoms/Logo";
import { ThemeToggle } from "@/common/atoms/ThemeToggle";
import { Button } from "@/common/atoms/ui/button";

export function WelcomeHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10">
      <Logo showWordmark href={null} />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </div>
    </header>
  );
}
