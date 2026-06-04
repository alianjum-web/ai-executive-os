"use client";

import { Menu, Bell } from "lucide-react";
import { ThemeToggle } from "@/common/atoms/ThemeToggle";
import { Button } from "@/common/atoms/ui/button";
import { useMobileNav } from "@/common/hooks/useMobileNav";
import { cn } from "@/common/lib/utils";

type AppHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AppHeader({ title, description, actions }: AppHeaderProps) {
  const { toggle } = useMobileNav();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--header-height)] shrink-0 items-center justify-between gap-4",
        "border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggle}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {title}
          </h1>
          {description ? (
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="text-muted-foreground"
          disabled
          title="Notifications coming soon"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
