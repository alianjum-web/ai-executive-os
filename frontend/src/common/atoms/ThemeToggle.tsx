"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/common/hooks/useTheme";
import { Button } from "@/common/atoms/ui/button";
import { cn } from "@/common/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("gap-2 text-muted-foreground", className)}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
