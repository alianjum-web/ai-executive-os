"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchEvaluationMetrics } from "@/common/api/client";
import type { EvaluationMetrics } from "@/common/types";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function EvaluationDashboard() {
  const enabled = useFeatureFlag("EVALUATION_DASHBOARD_ENABLED");
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvaluationMetrics();
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load evaluation metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  if (!enabled) return null;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
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
