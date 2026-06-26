"use client";

import { AttentionPanel } from "@/dashboard/organisms/AttentionPanel";
import { AIStatusPanel } from "@/dashboard/molecules/AIStatusPanel";
import { QuickActions } from "@/dashboard/organisms/QuickActions";
import { MetricsDashboard } from "@/dashboard/organisms/MetricsDashboard";
import { EvaluationDashboard } from "@/dashboard/organisms/EvaluationDashboard";
import { EvaluationHarnessPanel } from "@/dashboard/organisms/EvaluationHarnessPanel";
import { PlatformHighlights } from "@/dashboard/organisms/PlatformHighlights";
import { ExecutiveSummaryDashboard } from "@/dashboard/organisms/ExecutiveSummaryDashboard";
import { UnansweredQuestionsReport } from "@/dashboard/organisms/UnansweredQuestionsReport";
import { DemoSeedCard } from "@/dashboard/organisms/DemoSeedCard";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";


export function LeadershipDashboard({ showDemoSeed }: { showDemoSeed: boolean }) {
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