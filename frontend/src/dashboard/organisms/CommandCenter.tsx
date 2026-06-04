"use client";

import { AttentionPanel } from "@/dashboard/organisms/AttentionPanel";
import { AIStatusPanel } from "@/dashboard/organisms/AIStatusPanel";
import { QuickActions } from "@/dashboard/organisms/QuickActions";
import { MetricsDashboard } from "@/dashboard/organisms/MetricsDashboard";
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

export function CommandCenter() {
  const { isAdmin } = useRole();
  const analytics = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");

  if (!isAdmin) {
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

  return (
    <div className="space-y-8">
      <section
        className="grid gap-6 lg:grid-cols-3"
        aria-label="Command center overview"
      >
        <AttentionPanel />
        <AIStatusPanel />
        <QuickActions />
      </section>

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
    </div>
  );
}
