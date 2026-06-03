"use client";

import Link from "next/link";
import { MetricsDashboard } from "@/components/organisms/MetricsDashboard";
import { useRole } from "@/hooks/useRole";

export function DashboardContent() {
  const { isAdmin } = useRole();

  if (isAdmin) {
    return <MetricsDashboard />;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-zinc-900">Welcome</h2>
      <p className="mt-2 text-sm text-zinc-600">
        As an employee you can ask questions in the knowledge chat. Document
        uploads are restricted to administrators.
      </p>
      <Link
        href="/chat"
        className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Open chat
      </Link>
    </div>
  );
}
