"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  exportQueriesCsv,
  exportTicketsCsv,
  fetchAdvancedAnalytics,
  type AdvancedAnalyticsDashboard,
} from "@/lib/api";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Button } from "@/components/atoms/Button";

export function MetricsDashboard() {
  const enabled = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");
  const [metrics, setMetrics] = useState<AdvancedAnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setMetrics(await fetchAdvancedAnalytics());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    }
  };

  useEffect(() => {
    if (!enabled) return;
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!metrics) return <p className="text-sm text-zinc-500">Loading metrics…</p>;

  const topChartData = metrics.top_questions.map((q) => ({
    name: q.question.length > 28 ? `${q.question.slice(0, 28)}…` : q.question,
    count: q.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => exportQueriesCsv()}>
          Export queries CSV
        </Button>
        <Button type="button" onClick={() => exportTicketsCsv()}>
          Export tickets CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Queries today" value={String(metrics.queries_today)} />
        <MetricCard
          label="Latency p50"
          value={metrics.latency_p50_ms != null ? `${metrics.latency_p50_ms} ms` : "—"}
        />
        <MetricCard
          label="Latency p95"
          value={metrics.latency_p95_ms != null ? `${metrics.latency_p95_ms} ms` : "—"}
        />
        <MetricCard label="Documents indexed" value={String(metrics.documents_indexed)} />
        <MetricCard
          label="Agent accuracy"
          value={
            metrics.agent_accuracy_score != null
              ? `${metrics.agent_accuracy_score}/5 (${metrics.rated_queries_count} rated)`
              : "—"
          }
        />
      </div>

      <ChartPanel title={`Query volume (${metrics.period_days} days)`}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={metrics.query_volume_by_day}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#18181b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Top 10 questions">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="RAG latency distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metrics.latency_histogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3f3f46" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <ChartPanel title="Ticket resolution time distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metrics.ticket_resolution_histogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#71717a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-zinc-700">{title}</h2>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
