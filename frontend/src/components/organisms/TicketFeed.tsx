"use client";

import { TicketRow } from "@/components/molecules/TicketRow";
import { useTickets } from "@/hooks/useTickets";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function TicketFeed() {
  const enabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const { tickets, isLoading, error } = useTickets();

  if (!enabled) {
    return (
      <p className="text-sm text-zinc-500">Project Agent is disabled.</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (isLoading && tickets.length === 0) {
    return <p className="text-sm text-zinc-500">Loading tickets…</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">Summary</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No tickets yet. Send a message to your monitored Slack channel.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
