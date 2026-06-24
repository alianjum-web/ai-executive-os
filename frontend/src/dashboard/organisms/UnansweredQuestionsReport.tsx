"use client";

import { useEffect } from "react";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";
import { GapList } from "@/dashboard/molecules/GapList";
import { useUnansweredReport } from "@/dashboard/hooks/useUnansweredReport";

export function UnansweredQuestionsReport() {
  const { report, error, loading, load } = useUnansweredReport();

  // ✅ Effect only triggers the load function, doesn't manage state directly
  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

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
          Where your knowledge base is weak — {report.total_gaps} distinct gaps tracked
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