import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/features/orders/status";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("orders")
    .select("id,order_number,created_at,total,status,order_items(product_name,quantity)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });
  const orders: any[] = data ?? [];

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-lg font-extrabold">No orders yet.</p>
          <p className="mt-1 text-sm text-muted">When you place an order, it will show up here.</p>
          <Link href="/shop" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">Start Shopping</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold">#{o.order_number}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-xs text-muted">{new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
              <p className="mt-2 line-clamp-1 text-sm text-muted">{(o.order_items ?? []).map((i: any) => `${i.product_name} × ${i.quantity}`).join(", ")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-extrabold">{formatPrice(o.total)}</p>
                <Link href={`/orders/${o.id}`} className="rounded-full border border-ink px-5 py-2 text-sm font-bold hover:bg-ink hover:text-white">View order</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
