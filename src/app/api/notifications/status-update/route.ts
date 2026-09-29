import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
const STATUS_MESSAGE: Record<string, string> = {
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is now being processed.",
  shipped: "Your order is on its way!",
  delivered: "Your order has been delivered. Thanks for shopping with us!",
  cancelled: "Your order has been cancelled.",
};

function renderStatusEmailHtml(order: any, siteUrl: string) {
  const message = STATUS_MESSAGE[order.status] ?? `Your order status is now: ${STATUS_LABEL[order.status] ?? order.status}`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#12151a;">
    <h2 style="margin-bottom:4px;">Order #${order.order_number}</h2>
    <p style="font-size:16px;">${message}</p>
    <p style="color:#667085;font-size:14px;">Status: <strong>${STATUS_LABEL[order.status] ?? order.status}</strong></p>
    <a href="${siteUrl}/orders/${order.id}" style="display:inline-block;margin-top:16px;background:#12151a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:bold;">
      Track your order
    </a>
  </div>`;
}

// Called by the admin panel right after an order's status is changed.
// Fails silently (returns { sent:false }) if Resend isn't configured — never blocks the admin's status update.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ sent: false, reason: "unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ sent: false, reason: "forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "");
    if (!orderId) return NextResponse.json({ sent: false, reason: "missing_order" }, { status: 400 });

    const { data: order } = await supabase.from("orders").select("id,order_number,status,customer_email,user_id").eq("id", orderId).maybeSingle();
    if (!order) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ sent: false, reason: "not_configured" });

    let to = order.customer_email;
    if (!to && order.user_id) {
      const { data: buyer } = await supabase.from("profiles").select("email").eq("id", order.user_id).single();
      to = buyer?.email ?? null;
    }
    if (!to) return NextResponse.json({ sent: false, reason: "no_email" });

    const from = process.env.RESEND_FROM_EMAIL || "Mobile Store <onboarding@resend.dev>";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to,
        subject: `Order #${order.order_number} — ${STATUS_LABEL[order.status] ?? order.status}`,
        html: renderStatusEmailHtml(order, siteUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error("Resend error (status update):", err);
      return NextResponse.json({ sent: false, reason: "provider_error" });
    }
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("status update email error:", err);
    return NextResponse.json({ sent: false, reason: "server_error" });
  }
}
