"use client";

import { AttentionPanel } from "@/dashboard/organisms/AttentionPanel";
import { AIStatusPanel } from "@/dashboard/organisms/AIStatusPanel";
import { QuickActions } from "@/dashboard/organisms/QuickActions";
import { MetricsDashboard } from "@/dashboard/organisms/MetricsDashboard";
import { EvaluationDashboard } from "@/dashboard/organisms/EvaluationDashboard";
import { EvaluationHarnessPanel } from "@/dashboard/organisms/EvaluationHarnessPanel";
import { PlatformHighlights } from "@/dashboard/organisms/PlatformHighlights";
import { ExecutiveSummaryDashboard } from "@/dashboard/organisms/ExecutiveSummaryDashboard";
import { UnansweredQuestionsReport } from "@/dashboard/organisms/UnansweredQuestionsReport";
import { DemoSeedCard } from "@/dashboard/organisms/DemoSeedCard";
import { useRole } from "@/common/hooks/useRole";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Button } from "@/common/atoms/ui/button";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

function EmployeeWelcome() {
  return (
    <Card className="overflow-hidden border-accent-blue/20">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-widest text-accent-blue">
          Welcome back
        </p>
        <CardTitle className="text-xl">Your calm workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Ask the AI assistant about company policies and procedures. Administrators
          manage document uploads separately.
        </p>
        <Button asChild>
          <Link href="/chat">
            <MessageSquare className="h-4 w-4" />
            Open AI Assistant
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ManagerWelcome() {
  return (
    <Card className="overflow-hidden border-accent-blue/20">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-widest text-accent-blue">
          Manager view
        </p>
        <CardTitle className="text-xl">Team operations</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Department-scoped tickets, analytics, and knowledge gap reports. Upload
          and integrations remain admin-only.
        </p>
      </CardContent>
    </Card>
  );
}

function LeadershipDashboard({ showDemoSeed }: { showDemoSeed: boolean }) {
  const analytics = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");
  const evaluation = useFeatureFlag("EVALUATION_DASHBOARD_ENABLED");

  return (
    <div className="space-y-8">
      <ExecutiveSummaryDashboard />

      <section
        className="grid gap-6 lg:grid-cols-3"
        aria-label="Command center overview"
      >
        <AttentionPanel />
        <AIStatusPanel />
        <QuickActions />
      </section>

      {showDemoSeed ? <DemoSeedCard /> : null}

      <UnansweredQuestionsReport />

      {analytics ? (
        <section aria-label="Analytics">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Usage and system performance at a glance
            </p>
          </div>
          <MetricsDashboard />
        </section>
      ) : null}

      <PlatformHighlights />

      {evaluation ? (
        <section aria-label="RAG evaluation" className="space-y-8">
          <EvaluationDashboard />
          <EvaluationHarnessPanel />
        </section>
      ) : null}
    </div>
  );
}

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
