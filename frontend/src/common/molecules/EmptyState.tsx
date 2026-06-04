import type { LucideIcon } from "lucide-react";
import { cn } from "@/common/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-elevated/50 px-6 py-14 text-center",
        className
      )}
      role="status"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-accent-blue">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
