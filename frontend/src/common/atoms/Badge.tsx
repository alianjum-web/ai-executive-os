import { Badge as UIBadge, badgeVariants } from "@/common/atoms/ui/badge";
import clsx from "clsx";

const statusMap: Record<string, "default" | "success" | "warning" | "destructive" | "ai"> = {
  pending: "warning",
  processing: "ai",
  ready: "success",
  error: "destructive",
  pending_approval: "warning",
  open: "default",
  assigned: "ai",
  approved: "success",
  rejected: "destructive",
};

export function Badge({ status }: { status: string }) {
  const variant = statusMap[status] ?? "default";
  return (
    <UIBadge variant={variant} className={clsx("capitalize")}>
      {status}
    </UIBadge>
  );
}

export { badgeVariants };
