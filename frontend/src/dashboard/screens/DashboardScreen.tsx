import { ExecutiveSummary } from "@/common/types";
import { CommandCenter } from "@/dashboard/organisms/CommandCenter";

export function DashboardScreen({ executiveSummary}: {executiveSummary: ExecutiveSummary | null}) {
  return <CommandCenter executiveSummary={executiveSummary ?? null} />;
}
