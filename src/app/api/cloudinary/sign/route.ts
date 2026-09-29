import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";

// Admin-only: returns a signed upload payload. The API secret never leaves the server.
// Client then POSTs the file to https://api.cloudinary.com/v1_1/<cloudName>/image/upload
// with: file, api_key, timestamp, folder, signature.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary isn't configured on the server. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local, then restart `npm run dev`." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const folder = ["products", "brands", "banners", "categories", "payment"].includes(body?.folder)
      ? `mobile-store/${body.folder}`
      : "mobile-store/products";

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return NextResponse.json({ timestamp, folder, signature, apiKey, cloudName });
  } catch (err: any) {
    console.error("cloudinary sign error:", err);
    return NextResponse.json({ error: "Server error while preparing the upload." }, { status: 500 });
  }
}
