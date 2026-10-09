import { cn } from "@/lib/utils";

const LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  submitted: { label: "With our editors", className: "bg-amber-100 text-amber-800" },
  published: { label: "Published", className: "bg-green-100 text-green-800" },
  rejected: { label: "Sent back", className: "bg-red-100 text-red-700" },
  paid: { label: "Paid", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700" },
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" },
  refunded: { label: "Refunded", className: "bg-slate-200 text-slate-700" },
  canceled: { label: "Cancelled", className: "bg-slate-200 text-slate-700" },
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  trialing: { label: "Trial", className: "bg-blue-100 text-blue-800" },
  past_due: { label: "Past due", className: "bg-red-100 text-red-700" },
  unpaid: { label: "Unpaid", className: "bg-red-100 text-red-700" },
  incomplete: { label: "Incomplete", className: "bg-amber-100 text-amber-800" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = LABELS[status] || { label: status, className: "bg-slate-100 text-slate-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        entry.className,
        className
      )}
    >
      {entry.label}
    </span>
  );
}
