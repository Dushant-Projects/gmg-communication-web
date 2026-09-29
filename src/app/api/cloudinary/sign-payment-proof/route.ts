import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";

// Any logged-in customer can call this, but only for an order that belongs to them
// (enforced both by the explicit check below and by RLS on the orders select).
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "");
    if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });

    const { data: order } = await supabase.from("orders").select("id,user_id,payment_method").eq("id", orderId).maybeSingle();
    if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_method === "cod") return NextResponse.json({ error: "This order doesn't need a payment proof." }, { status: 400 });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary isn't configured on the server yet." }, { status: 500 });
    }

    const folder = "mobile-store/payment-proofs";
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return NextResponse.json({ timestamp, folder, signature, apiKey, cloudName });
  } catch (err) {
    console.error("payment proof sign error:", err);
    return NextResponse.json({ error: "Server error while preparing the upload." }, { status: 500 });
  }
}
