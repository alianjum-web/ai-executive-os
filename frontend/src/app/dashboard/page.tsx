import { DashboardScreen } from "@/dashboard/screens/DashboardScreen";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";

export default function DashboardPage() {
  return (
    <DashboardTemplate title="Command center">
      <DashboardScreen />
    </DashboardTemplate>
  );
}
