import clsx from "clsx";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-zinc-100 text-zinc-700"
      )}
    >
      {status}
    </span>
  );
}
