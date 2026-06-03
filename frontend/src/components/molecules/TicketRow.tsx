import { Badge } from "@/components/atoms/Badge";
import type { TicketRecord } from "@/lib/api";

const priorityColors: Record<number, string> = {
  1: "bg-zinc-100 text-zinc-600",
  2: "bg-blue-100 text-blue-800",
  3: "bg-amber-100 text-amber-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-red-100 text-red-800",
};

export function TicketRow({ ticket }: { ticket: TicketRecord }) {
  const priorityClass =
    ticket.priority != null
      ? priorityColors[ticket.priority] ?? "bg-zinc-100 text-zinc-700"
      : "bg-zinc-100 text-zinc-700";

  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50/80">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{ticket.summary ?? "—"}</p>
        <p className="mt-0.5 text-xs text-zinc-500 capitalize">
          {ticket.intent?.replace(/_/g, " ") ?? "unknown"}
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass}`}
        >
          P{ticket.priority ?? "?"}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge status={ticket.status} />
      </td>
      <td className="px-4 py-3 capitalize text-zinc-700">{ticket.source}</td>
      <td className="px-4 py-3 text-zinc-600">
        {ticket.assignee_email ?? "Unassigned"}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {new Date(ticket.created_at).toLocaleString()}
      </td>
    </tr>
  );
}
