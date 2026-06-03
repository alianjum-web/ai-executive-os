"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { getTicket, type TicketDetail } from "@/lib/api";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    getTicket(ticketId)
      .then(setTicket)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load ticket"));
  }, [ticketId]);

  return (
    <DashboardTemplate title="Ticket detail">
      <Link href="/tickets" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Back to feed
      </Link>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!ticket && !error && <p className="text-sm text-zinc-500">Loading…</p>}

      {ticket && (
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {ticket.summary ?? "Untitled ticket"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 capitalize">
                  {ticket.intent?.replace(/_/g, " ")} · {ticket.department} · {ticket.source}
                </p>
              </div>
              <Badge status={ticket.status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Priority</dt>
                <dd>P{ticket.priority ?? "?"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Assignee</dt>
                <dd>{ticket.assignee_email ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Jira issue</dt>
                <dd>
                  {ticket.jira_url ? (
                    <a
                      href={ticket.jira_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {ticket.external_ticket_id}
                    </a>
                  ) : (
                    ticket.external_ticket_id ?? "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Raw payload</h3>
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-zinc-50 p-4 text-xs text-zinc-800">
              {JSON.stringify(ticket.raw_payload, null, 2)}
            </pre>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Audit timeline</h3>
            {ticket.audit_timeline.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No activity logged yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ticket.audit_timeline.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex justify-between border-t border-zinc-100 pt-2 text-sm first:border-0 first:pt-0"
                  >
                    <span className="font-mono text-zinc-800">{entry.action}</span>
                    <span className="text-zinc-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DashboardTemplate>
  );
}
