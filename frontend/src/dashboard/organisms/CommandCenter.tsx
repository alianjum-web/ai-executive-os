"use client";

import { AIStatusPanel } from "@/dashboard/molecules/AIStatusPanel";
import { QuickActions } from "@/dashboard/organisms/QuickActions";
import { useRole } from "@/common/hooks/useRole";
import { EmployeeWelcome } from "../atoms/EmployeeWelcome";
import { ManagerWelcome } from "../atoms/ManagerWelcome";
import { LeadershipDashboard } from "./LeaderShipBoard";


export function CommandCenter() {
  const { isAdmin, isManager, isLeadership } = useRole();

  if (!isLeadership) {
    return (
      <div className="space-y-6">
        <EmployeeWelcome />
        <div className="grid gap-6 lg:grid-cols-2">
          <AIStatusPanel />
          <QuickActions />
        </div>
      </div>
    );
  }

  if (isManager && !isAdmin) {
    return (
      <div className="space-y-6">
        <ManagerWelcome />
        <LeadershipDashboard showDemoSeed={false} />
      </div>
    );
  }

  return <LeadershipDashboard showDemoSeed={isAdmin} />;
}
