"use client";

import { useCallback, useState } from "react";
import { FlaskConical, Play } from "lucide-react";
import { runEvaluationHarness } from "@/common/api/client";
import type { HarnessRunResponse } from "@/common/types";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Button } from "@/common/atoms/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { ErrorState } from "@/common/molecules/ErrorState";
import { cn } from "@/common/lib/utils";

export function EvaluationHarnessPanel() {
  const enabled = useFeatureFlag("EVALUATION_DASHBOARD_ENABLED");
  const [result, setResult] = useState<HarnessRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await runEvaluationHarness();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Harness run failed");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!enabled) return null;

  return (
    <section className="space-y-4" aria-label="RAG evaluation harness">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">RAG evaluation harness</h2>
          <p className="text-sm text-muted-foreground">
            Golden questions with pass/fail regression checks
          </p>
        </div>
        <Button onClick={() => void run()} isLoading={busy} disabled={busy}>
          <Play className="h-4 w-4" aria-hidden />
          Run harness
        </Button>
      </div>

      {error ? <ErrorState message={error} onRetry={() => void run()} /> : null}

      {result ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-ai/10 text-accent-ai">
              <FlaskConical className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">
                {result.accuracy_pct}% accuracy
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {result.passed} passed · {result.failed} failed · {result.total_cases}{" "}
                cases
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.results.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    row.passed
                      ? "border-success/30 bg-success/5"
                      : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-foreground">{row.question}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold uppercase",
                        row.passed ? "text-success" : "text-destructive"
                      )}
                    >
                      {row.passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {row.answer_preview || "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Confidence{" "}
                    {row.confidence_score != null
                      ? `${Math.round(row.confidence_score * 100)}%`
                      : "—"}
                    {row.escalated ? " · escalated" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
