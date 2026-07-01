import { DashboardScreen } from "@/dashboard/screens/DashboardScreen";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";
import { useExecutiveSummary } from "@/dashboard/hooks/useExecutiveSummary";

export default function DashboardPage() {
  const executiveSummary = useExecutiveSummary();
  return (
    <DashboardTemplate title="Command center">
      <DashboardScreen executiveSummary={executiveSummary.summary ?? null} />
    </DashboardTemplate>
  );
}
