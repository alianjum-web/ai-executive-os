"use client";

import { useEffect } from "react";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";
import { Metric } from "@/dashboard/atoms/Metric";
import { useEvaluationMetrics } from "@/dashboard/hooks/useEvaluationMetrics";

export function EvaluationDashboard() {
  const enabled = useFeatureFlag("EVALUATION_DASHBOARD_ENABLED");
  const { metrics, error, loading, load } = useEvaluationMetrics(enabled);

  // ✅ Effect only triggers the load function when enabled changes
  useEffect(() => {
    if (enabled) {
      load();
    }
  }, [enabled, load]);

  if (!enabled) return null;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !metrics) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <section className="space-y-4" aria-label="RAG evaluation">
      <div>
        <h2 className="font-display text-lg font-semibold">RAG evaluation</h2>
        <p className="text-sm text-muted-foreground">
          Accuracy, confidence, and escalation trends
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Accuracy (feedback)"
          value={
            metrics.accuracy_pct != null ? `${metrics.accuracy_pct}%` : "—"
          }
        />
        <Metric
          label="Avg confidence"
          value={
            metrics.avg_confidence_pct != null
              ? `${metrics.avg_confidence_pct}%`
              : "—"
          }
        />
        <Metric
          label="Escalation rate"
          value={`${metrics.escalation_rate_pct}%`}
        />
        <Metric
          label="Low-confidence queries"
          value={String(metrics.low_confidence_queries)}
        />
      </div>
      {metrics.unanswered_questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top escalated questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {metrics.unanswered_questions.map((row) => (
                <li
                  key={row.question}
                  className="flex justify-between gap-4 border-b border-border-subtle py-2 last:border-0"
                >
                  <span className="text-foreground">{row.question}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {row.count}×
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

