import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/common/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-foreground",
        secondary: "border-border bg-surface-elevated text-muted-foreground",
        success:
          "border-transparent bg-success/15 text-success",
        warning:
          "border-transparent bg-warning/15 text-warning",
        destructive:
          "border-transparent bg-destructive/15 text-destructive",
        ai: "border-transparent bg-accent-ai/15 text-accent-ai",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
