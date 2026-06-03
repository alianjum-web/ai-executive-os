import { DashboardContent } from "@/app/dashboard/DashboardContent";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function DashboardPage() {
  return (
    <DashboardTemplate title="Dashboard">
      <DashboardContent />
    </DashboardTemplate>
  );
}
