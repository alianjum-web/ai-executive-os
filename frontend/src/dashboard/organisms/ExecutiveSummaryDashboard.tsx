"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";
import { fetchExecutiveSummary } from "@/common/api/client";
import type { ExecutiveSummary } from "@/common/types";
import { Card, CardContent } from "@/common/atoms/ui/card";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {value}
            </p>
            {hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveSummaryDashboard() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchExecutiveSummary());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load executive summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
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
