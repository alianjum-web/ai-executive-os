"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAnalytics, type AnalyticsDashboard } from "@/lib/api";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function MetricsDashboard() {
  const enabled = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");
  const [metrics, setMetrics] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setMetrics(await fetchAnalytics());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    }
  };

  useEffect(() => {
    if (!enabled) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!metrics) return <p className="text-sm text-zinc-500">Loading metrics…</p>;

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
          value={metrics.latency_p50_ms != null ? `${metrics.latency_p50_ms} ms` : "—"}
        />
        <MetricCard
          label="Latency p95"
          value={metrics.latency_p95_ms != null ? `${metrics.latency_p95_ms} ms` : "—"}
        />
        <MetricCard
          label="Documents indexed"
          value={String(metrics.documents_indexed)}
        />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Top questions</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
