import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Ticket,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { cn } from "@/common/lib/utils";

type Action = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const actions: Action[] = [
  {
    href: "/chat",
    label: "Ask AI",
    description: "Query policies & SOPs",
    icon: MessageSquare,
  },
  {
    href: "/knowledge",
    label: "Upload docs",
    description: "Add knowledge",
    icon: Upload,
  },
  {
    href: "/tickets",
    label: "Review tasks",
    description: "Routing feed",
    icon: Ticket,
  },
  {
    href: "/knowledge",
    label: "Browse library",
    description: "All documents",
    icon: BookOpen,
  },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          What should I do next?
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group flex items-start gap-3 rounded-lg border border-border bg-background/50 p-3 transition-all duration-200 hover:border-accent-blue/40 hover:bg-muted"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue transition-colors group-hover:bg-accent-blue/20">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {action.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
