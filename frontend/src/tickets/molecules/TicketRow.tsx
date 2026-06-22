"use client";

import { useState } from "react";
import { Badge } from "@/common/atoms/Badge";
import { Button } from "@/common/atoms/ui/button";
import { approveTicket, rejectTicket, type TicketRecord } from "@/common/api/client";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useRole } from "@/common/hooks/useRole";
import { cn } from "@/common/lib/utils";

const priorityColors: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-accent-blue/15 text-accent-blue",
  3: "bg-warning/15 text-warning",
  4: "bg-orange-500/15 text-orange-400",
  5: "bg-destructive/15 text-destructive",
};

export function TicketRow({
  ticket,
  onUpdated,
}: {
  ticket: TicketRecord;
  onUpdated?: () => void;
}) {
  const approvalEnabled = useFeatureFlag("TICKET_APPROVAL_ENABLED");
  const { isLeadership } = useRole();
  const [busy, setBusy] = useState(false);
  const priorityClass =
    ticket.priority != null
      ? priorityColors[ticket.priority] ?? "bg-muted text-muted-foreground"
      : "bg-muted text-muted-foreground";

  const pending =
    ticket.requires_approval &&
    (ticket.approval_status === "pending" ||
      ticket.approval_status === "pending_approval" ||
      ticket.status === "pending_approval");

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveTicket(ticket.id);
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await rejectTicket(ticket.id);
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

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
        <div>{new Date(ticket.created_at).toLocaleString()}</div>
        {ticket.external_ticket_id ? (
          <div className="mt-1 text-accent-blue">Jira: {ticket.external_ticket_id}</div>
        ) : null}
        {approvalEnabled && isLeadership && pending ? (
          <div className="mt-2 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void handleApprove()}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void handleReject()}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
