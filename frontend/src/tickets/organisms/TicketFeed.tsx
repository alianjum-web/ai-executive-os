"use client";

import { Inbox } from "lucide-react";
import { TicketRow } from "@/tickets/molecules/TicketRow";
import { useTickets } from "@/tickets/hooks/useTickets";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Card } from "@/common/atoms/ui/card";
import { LoadingBlock } from "@/common/molecules/LoadingBlock";
import { ErrorState } from "@/common/molecules/ErrorState";
import { EmptyState } from "@/common/molecules/EmptyState";

export function TicketFeed() {
  const enabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const { tickets, isLoading, error, refresh } = useTickets();

  if (!enabled) {
    return (
      <EmptyState
        icon={Inbox}
        title="Project Agent disabled"
        description="Enable PROJECT_AGENT_ENABLED to view the routing feed."
      />
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading && tickets.length === 0) {
    return <LoadingBlock rows={5} label="Loading tickets" />;
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="All caught up"
        description="No tickets yet. Send a message to your monitored Slack channel to create one."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Summary
              </th>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Priority
              </th>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Status
              </th>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Source
              </th>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Assignee
              </th>
              <th className="px-4 py-3.5 font-medium" scope="col">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onUpdated={() => void refresh()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
