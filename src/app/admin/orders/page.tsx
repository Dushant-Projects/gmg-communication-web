import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/features/orders/status";

export const metadata: Metadata = { title: "Admin · Orders" };
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("orders").select("id,order_number,customer_name,customer_phone,total,status,payment_status,created_at").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q?.trim()) query = query.or(`order_number.ilike.%${q.trim()}%,customer_name.ilike.%${q.trim()}%,customer_phone.ilike.%${q.trim()}%`);
  const { data } = await query;
  const orders = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Orders</h1>

      <form className="mt-4 flex flex-wrap gap-3">
        <input name="q" defaultValue={q ?? ""} placeholder="Search order #, name or phone…" className="h-11 flex-1 min-w-[220px] rounded-full border border-line px-4 text-sm outline-none focus:border-ink" />
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-full border border-line px-4 text-sm font-semibold">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-bold text-white">Filter</button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold uppercase text-muted">
              <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3 font-bold">#{o.order_number}</td>
                <td className="p-3"><p>{o.customer_name}</p><p className="text-xs text-muted">{o.customer_phone}</p></td>
                <td className="p-3 text-muted">{new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                <td className="p-3 font-semibold">{formatPrice(o.total)}</td>
                <td className="p-3"><StatusBadge status={o.status} /></td>
                <td className="p-3 capitalize text-muted">{o.payment_status}</td>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="text-xs font-bold hover:underline">Open</Link></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
