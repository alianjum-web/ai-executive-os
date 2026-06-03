import { TicketFeed } from "@/components/organisms/TicketFeed";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function TicketsPage() {
  return (
    <DashboardTemplate title="Ticket routing feed">
      <p className="mb-4 text-sm text-zinc-600">
        Incoming Slack and email messages are classified, synced to Jira when configured, and
        assigned with workload balancing. Refreshes every 5 seconds.
      </p>
      <TicketFeed />
    </DashboardTemplate>
  );
}
