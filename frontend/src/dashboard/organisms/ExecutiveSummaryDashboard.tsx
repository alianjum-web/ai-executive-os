"use client";

import { Clock, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";
import { KpiCard } from "@/dashboard/atoms/KpiCard";
import { Card, CardContent } from "@/common/atoms/ui/card";
import { useExecutiveSummary } from "@/dashboard/hooks/useExecutiveSummary";

export function ExecutiveSummaryDashboard() {
  const { summary, error, loading, load } = useExecutiveSummary();

  // ✅ Effect only calls load and doesn't directly manage state
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !summary) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const scopeNote = summary.department_scope
    ? `Scoped to ${summary.department_scope} department`
    : "Organization-wide";

  return (
    <section className="space-y-4" aria-label="Executive summary">
      <div>
        <h2 className="font-display text-lg font-semibold">Executive summary</h2>
        <p className="text-sm text-muted-foreground">
          ROI at a glance — {scopeNote}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Queries automated"
          value={String(summary.automated_queries)}
          hint={`${summary.automation_rate_pct}% of ${summary.total_queries} total`}
          icon={MessageSquare}
        />
        <KpiCard
          label="Hours saved (est.)"
          value={`${summary.estimated_hours_saved}h`}
          hint="25 min saved per automated lookup"
          icon={Clock}
        />
        <KpiCard
          label="Queries today"
          value={String(summary.queries_today)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Knowledge gaps"
          value={String(
            summary.knowledge_gaps.length + summary.low_confidence_unanswered
          )}
          hint={`${summary.escalated_queries} escalated`}
          icon={AlertTriangle}
        />
      </div>
      {summary.knowledge_gaps.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-foreground">Top knowledge gaps</p>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.knowledge_gaps.slice(0, 5).map((row) => (
                <li
                  key={row.question}
                  className="flex justify-between gap-4 border-b border-border-subtle py-2 last:border-0"
                >
                  <span>{row.question}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {row.count}× escalated
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