import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderStatusControl } from "@/features/admin/order-status-control";

export const metadata: Metadata = { title: "Admin · Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const items: any[] = order.order_items ?? [];

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-bold text-muted hover:text-ink">← All orders</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Order #{order.order_number}</h1>
      </div>
      <p className="text-sm text-muted">Placed {new Date(order.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>

      <div className="mt-5 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-extrabold">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">{it.image_url && <Image src={it.image_url} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold">{it.product_name}</p>
                    {it.variant_label && <p className="text-xs text-muted">{it.variant_label}</p>}
                    <p className="text-xs text-muted">{formatPrice(it.unit_price)} × {it.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(it.line_total)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-extrabold">Customer & delivery</h2>
            <p className="mt-2 text-sm">{order.customer_name} · {order.customer_phone}{order.customer_email ? ` · ${order.customer_email}` : ""}</p>
            <p className="text-sm text-muted">{[order.shipping_address, order.shipping_area, order.shipping_city, order.shipping_postal_code].filter(Boolean).join(", ")}</p>
            {order.notes && <p className="mt-2 text-sm text-muted">Notes: {order.notes}</p>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-extrabold">Update status</h2>
            <div className="mt-3"><OrderStatusControl orderId={order.id} status={order.status} paymentStatus={order.payment_status} /></div>
            <p className="mt-3 text-xs text-muted">Cancelling an order automatically returns items to stock.</p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="font-extrabold">Payment</h2>
            <p className="mt-2 capitalize">{order.payment_method.replace("_", " ")}</p>
            {order.payment_method !== "cod" && (
              <div className="mt-3 rounded-xl bg-mist p-3">
                <p className="font-bold">Customer's payment proof</p>
                {order.payment_proof_url ? (
                  <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    <Image src={order.payment_proof_url} alt="Payment screenshot" width={160} height={160} className="rounded-lg border border-line object-cover" />
                  </a>
                ) : (
                  <p className="mt-1 text-muted">No screenshot uploaded yet.</p>
                )}
                {order.payment_reference && <p className="mt-2">Reference: <span className="font-semibold">{order.payment_reference}</span></p>}
              </div>
            )}
            <dl className="mt-4 space-y-1.5 border-t border-line pt-3">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt><dd>{order.discount_amount > 0 ? `- ${formatPrice(order.discount_amount)}` : formatPrice(0)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatPrice(order.shipping_fee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
