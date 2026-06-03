import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function DashboardPage() {
  return (
    <DashboardTemplate title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Knowledge Agent</p>
          <p className="mt-1 text-2xl font-semibold">Active</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Documents</p>
          <p className="mt-1 text-2xl font-semibold">Upload & query</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Sprint</p>
          <p className="mt-1 text-2xl font-semibold">1 — MVP</p>
        </div>
      </div>
    </DashboardTemplate>
  );
}
