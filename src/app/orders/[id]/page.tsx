import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StatusBadge, Timeline } from "@/features/orders/status";
import { ReviewForm } from "@/features/orders/review-form";
import { PaymentInstructions } from "@/features/orders/payment-instructions";
import { PaymentProofUpload } from "@/features/orders/payment-proof-upload";

export const metadata: Metadata = { title: "Order details" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_TEXT: Record<string, string> = { unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" };

export default async function OrderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);

  // RLS: customers only get their own orders (admins can open any)
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id,order_id,product_id,variant_id,product_name,variant_label,image_url,unit_price,quantity,line_total)")
    .eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: paymentSetting } = order.payment_method !== "cod"
    ? await supabase.from("payment_settings").select("method,display_name,account_title,account_number,iban,qr_image_url,instructions").eq("method", order.payment_method).maybeSingle()
    : { data: null };

  const { data: myReviews } = await supabase.from("reviews").select("product_id,status").eq("order_id", id).eq("user_id", user.id);
  const reviewed = new Map((myReviews ?? []).map((r: any) => [r.product_id, r.status]));
  const items: any[] = order.order_items ?? [];
  const date = new Date(order.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {placed === "1" && (
        <div className="mb-8 rounded-3xl bg-mist p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-green-700" />
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Order Placed Successfully</h1>
          <p className="mt-2 font-bold">Order #{order.order_number}</p>
          <p className="mt-1 text-sm text-muted">Thank you for your order.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/account/orders" className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">View Orders</Link>
            <Link href="/shop" className="rounded-full border border-ink px-6 py-3 text-sm font-bold">Continue Shopping</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Order #{order.order_number}</h2>
          <p className="text-sm text-muted">Placed on {date}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line p-5">
            <h3 className="font-extrabold">Items</h3>
            <ul className="mt-4 divide-y divide-line">
              {items.map((it) => {
                const status = it.product_id ? reviewed.get(it.product_id) : null;
                return (
                  <li key={it.id} className="py-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                        {it.image_url && <Image src={it.image_url} alt="" fill sizes="64px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-bold">{it.product_name}</p>
                        {it.variant_label && <p className="text-xs text-muted">{it.variant_label}</p>}
                        <p className="text-xs text-muted">{formatPrice(it.unit_price)} × {it.quantity}</p>
                      </div>
                      <p className="text-sm font-bold">{formatPrice(it.line_total)}</p>
                    </div>
                    {order.status === "delivered" && it.product_id && (
                      status
                        ? <p className="mt-2 text-sm text-muted">Review submitted{status === "pending" ? " (awaiting approval)" : ""}.</p>
                        : <ReviewForm userId={user.id} orderId={order.id} productId={it.product_id} />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-line p-5">
            <h3 className="font-extrabold">Delivery</h3>
            <p className="mt-2 text-sm">{order.customer_name} · {order.customer_phone}</p>
            <p className="text-sm text-muted">{[order.shipping_address, order.shipping_area, order.shipping_city, order.shipping_postal_code].filter(Boolean).join(", ")}</p>
            {order.notes && <p className="mt-2 text-sm text-muted">Notes: {order.notes}</p>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line p-5">
            <h3 className="mb-4 font-extrabold">Order status</h3>
            <Timeline status={order.status} />
          </section>

          <section className="rounded-2xl border border-line p-5 text-sm">
            <h3 className="font-extrabold">Payment</h3>
            <p className="mt-2">{order.payment_method === "cod" ? "Cash on Delivery" : "Bank Transfer"} · <span className="font-bold">{PAYMENT_TEXT[order.payment_status]}</span></p>

            <dl className="mt-4 space-y-1.5 border-t border-line pt-3">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt><dd>{order.discount_amount > 0 ? `- ${formatPrice(order.discount_amount)}` : formatPrice(0)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatPrice(order.shipping_fee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          {order.payment_method !== "cod" && order.payment_status !== "paid" && order.status !== "cancelled" && paymentSetting && (
            <>
              <PaymentInstructions setting={paymentSetting} />
              <PaymentProofUpload orderId={order.id} existingUrl={order.payment_proof_url} existingReference={order.payment_reference} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
