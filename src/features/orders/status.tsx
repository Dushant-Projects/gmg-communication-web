import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700", confirmed: "bg-blue-50 text-blue-700", processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700", delivered: "bg-green-50 text-green-700", cancelled: "bg-red-50 text-sale",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_STYLE[status])}>{STATUS_LABEL[status] ?? status}</span>;
}

const STEPS = ["Order Placed", "Confirmed", "Processing", "Shipped", "Delivered"];
const INDEX: Record<string, number> = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };

export function Timeline({ status }: { status: string }) {
  if (status === "cancelled")
    return <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-sale">This order was cancelled.</p>;

  const idx = INDEX[status] ?? 0;
  return (
    <ol className="space-y-0">
      {STEPS.map((label, i) => {
        const done = i < idx || status === "delivered";
        const current = i === idx && status !== "delivered";
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 text-white",
                done ? "border-ink bg-ink" : current ? "border-ink bg-white" : "border-line bg-white")}>
                {done ? <Check size={14} /> : current ? <span className="h-2.5 w-2.5 rounded-full bg-ink" /> : null}
              </span>
              {i < STEPS.length - 1 && <span className={cn("h-8 w-0.5", i < idx ? "bg-ink" : "bg-line")} />}
            </div>
            <p className={cn("pt-1 text-sm", done || current ? "font-bold" : "text-muted")}>{label}</p>
          </li>
        );
      })}
    </ol>
  );
}
