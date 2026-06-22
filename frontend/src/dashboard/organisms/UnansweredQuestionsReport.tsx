"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUnansweredReport } from "@/common/api/client";
import type { UnansweredQuestionsReport as UnansweredReport } from "@/common/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";

function GapList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { question: string; count: number }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li
                key={`${title}-${row.question}`}
                className="flex justify-between gap-4 border-b border-border-subtle py-2 last:border-0"
              >
                <span className="text-foreground">{row.question}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function UnansweredQuestionsReport() {
  const [report, setReport] = useState<UnansweredReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchUnansweredReport());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gap report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (loading || !report) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <section className="space-y-4" aria-label="Unanswered questions report">
      <div>
        <h2 className="font-display text-lg font-semibold">
          Unanswered questions report
        </h2>
        <p className="text-sm text-muted-foreground">
          Where your knowledge base is weak — {report.total_gaps} distinct gaps
          tracked
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <GapList
          title="Escalated to human"
          rows={report.escalated}
          empty="No escalations yet — great coverage."
        />
        <GapList
          title="Low confidence (not escalated)"
          rows={report.low_confidence}
          empty="No low-confidence queries without escalation."
        />
        <GapList
          title="Negative feedback"
          rows={report.negative_feedback}
          empty="No thumbs-down feedback yet."
        />
      </div>
    </section>
  );
}
