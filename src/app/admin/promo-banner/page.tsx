import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PromoBannerManager } from "@/features/admin/promo-banner-manager";

export const metadata: Metadata = { title: "Admin · Promo Banner" };

export default async function AdminPromoBannerPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("promo_banner").select("*").eq("id", "main").maybeSingle();
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Promo banner</h1>
      <p className="mt-1 max-w-lg text-sm text-muted">A countdown banner shown at the top of the homepage — good for sales and limited-time offers.</p>
      <div className="mt-5">
        <PromoBannerManager initial={data ?? { id: "main", title: null, subtitle: null, ends_at: null, href: null, is_active: false }} />
      </div>
    </div>
  );
}
