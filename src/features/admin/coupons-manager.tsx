"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";

type Coupon = {
  id: string; code: string; discount_type: "percentage" | "fixed"; discount_value: number;
  min_order: number; max_discount: number | null; starts_at: string; expires_at: string | null;
  usage_limit: number | null; used_count: number; is_active: boolean;
};
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const EMPTY = { code: "", discount_type: "percentage" as const, discount_value: "", min_order: "0", max_discount: "", starts_at: "", expires_at: "", usage_limit: "" };
const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

export function CouponsManager({ initial }: { initial: Coupon[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Coupon[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as Coupon[]);
  };

  const open = (c?: Coupon) => {
    setError(null);
    setEditing(c ? c.id : "new");
    setF(c ? {
      code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value),
      min_order: String(c.min_order), max_discount: c.max_discount != null ? String(c.max_discount) : "",
      starts_at: toDateInput(c.starts_at), expires_at: toDateInput(c.expires_at), usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
    } : EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(f.discount_value);
    if (!(value > 0) || (f.discount_type === "percentage" && value > 100)) {
      setError("Enter a valid discount value (percentage must be 100 or less).");
      return;
    }
    setBusy(true); setError(null);
    const row = {
      code: f.code.trim().toUpperCase(), discount_type: f.discount_type, discount_value: value,
      min_order: Number(f.min_order) || 0, max_discount: f.max_discount ? Number(f.max_discount) : null,
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : new Date().toISOString(),
      expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
      usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
    };
    const { error: err } = editing === "new"
      ? await supabase.from("coupons").insert(row)
      : await supabase.from("coupons").update(row).eq("id", editing!);
    setBusy(false);
    if (err) return setError(err.code === "23505" ? "This coupon code already exists." : "We couldn't save this coupon.");
    setEditing(null);
    await reload();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    await supabase.from("coupons").delete().eq("id", c.id);
    await reload();
  };

  const toggle = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    await reload();
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold uppercase text-muted">
              <th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3 font-bold">{c.code}</td>
                <td className="p-3">{c.discount_type === "percentage" ? `${c.discount_value}%` : formatPrice(c.discount_value)}{c.max_discount ? ` (max ${formatPrice(c.max_discount)})` : ""}</td>
                <td className="p-3">{formatPrice(c.min_order)}</td>
                <td className="p-3">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                <td className="p-3 text-muted">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-GB") : "Never"}</td>
                <td className="p-3"><button onClick={() => toggle(c)} className={cn("rounded-full px-3 py-1 text-xs font-bold", c.is_active ? "bg-green-50 text-green-700" : "bg-mist text-muted")}>{c.is_active ? "Active" : "Off"}</button></td>
                <td className="p-3"><div className="flex gap-3 text-xs font-bold"><button onClick={() => open(c)} className="hover:underline">Edit</button><button onClick={() => remove(c)} className="text-sale hover:underline">Delete</button></div></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-4 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
          <input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="Code (e.g. WELCOME10)" className={cn(input, "sm:col-span-2 uppercase")} />
          <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value as any })} className={input}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount (PKR)</option>
          </select>
          <input required type="number" min={0} value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} placeholder="Discount value" className={input} />
          <input type="number" min={0} value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} placeholder="Minimum order (PKR)" className={input} />
          <input type="number" min={0} value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} placeholder="Max discount cap (optional)" className={input} />
          <label className="text-xs font-bold text-muted">Starts on<input type="date" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} className={cn(input, "mt-1 font-normal text-ink")} /></label>
          <label className="text-xs font-bold text-muted">Expires on (optional)<input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className={cn(input, "mt-1 font-normal text-ink")} /></label>
          <input type="number" min={0} value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} placeholder="Usage limit (optional)" className={input} />
          {error && <p role="alert" className="text-sm text-sale sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-6 text-sm font-bold">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => open()} className="mt-4 h-11 rounded-full border border-ink px-6 text-sm font-bold hover:bg-ink hover:text-white">+ Add coupon</button>
      )}
    </div>
  );
}
