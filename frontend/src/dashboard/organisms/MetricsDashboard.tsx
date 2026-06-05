"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyticsPolling } from "@/common/config/polling.config";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { isApiUnreachableError } from "@/common/api/fetch";
import { fetchAnalytics, type AnalyticsDashboard } from "@/common/api/client";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Skeleton } from "@/common/atoms/ui/skeleton";
import { ErrorState } from "@/common/molecules/ErrorState";

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,var(--accent-blue),var(--accent-ai))]"
        aria-hidden
      />
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard() {
  const enabled = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");
  const [metrics, setMetrics] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [chartColors, setChartColors] = useState({
    tick: "#94a3b8",
    grid: "#243047",
    bar: "#4f8cff",
    tooltipBg: "#1a2336",
    tooltipFg: "#f8fafc",
  });

  const showLoadingOnNextPoll = useRef(enabled);

  const load = useCallback(async () => {
    if (!enabled) return;
    if (showLoadingOnNextPoll.current) {
      showLoadingOnNextPoll.current = false;
      setIsLoading(true);
    }
    try {
      setMetrics(await fetchAnalytics());
      setError(null);
      setApiUnreachable(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
      if (isApiUnreachableError(e)) setApiUnreachable(true);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) showLoadingOnNextPoll.current = true;
  }, [enabled]);

  useVisibilityPolling({
    enabled: enabled && !apiUnreachable,
    onPoll: load,
    ...analyticsPolling,
  });

  useEffect(() => {
    const sync = () => {
      setChartColors({
        tick: cssVar("--muted-foreground", "#94a3b8"),
        grid: cssVar("--chart-grid", "#243047"),
        bar: cssVar("--chart-1", "#4f8cff"),
        tooltipBg: cssVar("--chart-tooltip-bg", "#1a2336"),
        tooltipFg: cssVar("--chart-tooltip-fg", "#f8fafc"),
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  if (!enabled) return null;
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (isLoading && !metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!metrics) {
    return null;
  }

  const chartData = metrics.top_questions.map((q) => ({
    name: q.question.length > 32 ? `${q.question.slice(0, 32)}…` : q.question,
    count: q.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Queries today" value={String(metrics.queries_today)} />
        <MetricCard
          label="Latency p50"
          value={
            metrics.latency_p50_ms != null
              ? `${metrics.latency_p50_ms} ms`
              : "—"
          }
        />
        <MetricCard
          label="Latency p95"
          value={
            metrics.latency_p95_ms != null
              ? `${metrics.latency_p95_ms} ms`
              : "—"
          }
        />
        <MetricCard
          label="Documents indexed"
          value={String(metrics.documents_indexed)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: chartColors.tick }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chartColors.tick }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.grid}`,
                    borderRadius: "0.75rem",
                    color: chartColors.tooltipFg,
                  }}
                  cursor={{ fill: "rgba(79, 140, 255, 0.08)" }}
                />
                <Bar
                  dataKey="count"
                  fill={chartColors.bar}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
