import { Badge } from "@/common/atoms/Badge";
import type { TicketRecord } from "@/common/services/api/client";
import { cn } from "@/common/lib/utils";

const priorityColors: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-accent-blue/15 text-accent-blue",
  3: "bg-warning/15 text-warning",
  4: "bg-orange-500/15 text-orange-400",
  5: "bg-destructive/15 text-destructive",
};

export function TicketRow({ ticket }: { ticket: TicketRecord }) {
  const priorityClass =
    ticket.priority != null
      ? priorityColors[ticket.priority] ?? "bg-muted text-muted-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <tr className="border-t border-border-subtle transition-colors hover:bg-muted/40">
      <td className="px-4 py-3.5">
        <p className="font-medium text-foreground">{ticket.summary ?? "—"}</p>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
          {ticket.intent?.replace(/_/g, " ") ?? "unknown"}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
            priorityClass
          )}
        >
          P{ticket.priority ?? "?"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <Badge status={ticket.status} />
      </td>
      <td className="px-4 py-3.5 capitalize text-muted-foreground">
        {ticket.source}
      </td>
      <td className="px-4 py-3.5 text-muted-foreground">
        {ticket.assignee_email ?? "Unassigned"}
      </td>
      <td className="px-4 py-3.5 text-xs text-muted-foreground">
        {new Date(ticket.created_at).toLocaleString()}
      </td>
    </tr>
  );
}
