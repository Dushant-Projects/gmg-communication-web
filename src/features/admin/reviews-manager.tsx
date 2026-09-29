"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Review = {
  id: string; rating: number; comment: string | null; status: "pending" | "approved" | "hidden"; created_at: string;
  products: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};
const one = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
const STATUS_STYLE: Record<string, string> = { pending: "bg-amber-50 text-amber-700", approved: "bg-green-50 text-green-700", hidden: "bg-mist text-muted" };

export function ReviewsManager({ initial }: { initial: Review[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Review[]>(initial);
  const [filter, setFilter] = useState<"all" | Review["status"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (id: string, status: Review["status"]) => {
    setBusyId(id);
    await supabase.from("reviews").update({ status }).eq("id", id);
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    await supabase.from("reviews").delete().eq("id", id);
    setList((prev) => prev.filter((r) => r.id !== id));
    setBusyId(null);
  };

  const shown = filter === "all" ? list : list.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex gap-2">
        {(["all", "pending", "approved", "hidden"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-4 py-2 text-sm font-bold capitalize", filter === s ? "bg-ink text-white" : "border border-line")}>{s}</button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {shown.map((r) => {
          const product = one(r.products);
          const profile = one(r.profiles);
          return (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{product?.name ?? "Product"}</p>
                  <p className="text-xs text-muted">{profile?.full_name || profile?.email || "Customer"} · {new Date(r.created_at).toLocaleDateString("en-GB")}</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
              <div className="mt-3 flex gap-3 text-xs font-bold">
                {r.status !== "approved" && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, "approved")} className="text-green-700 hover:underline">Approve</button>}
                {r.status !== "hidden" && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, "hidden")} className="hover:underline">Hide</button>}
                <button disabled={busyId === r.id} onClick={() => remove(r.id)} className="text-sale hover:underline">Delete</button>
              </div>
            </li>
          );
        })}
        {shown.length === 0 && <li className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No reviews here.</li>}
      </ul>
    </div>
  );
}
