import { TicketFeed } from "@/tickets/organisms/TicketFeed";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";

export function TicketsScreen() {
  return (
    <DashboardTemplate title="Ticket routing">
      <TicketFeed />
    </DashboardTemplate>
  );
}
