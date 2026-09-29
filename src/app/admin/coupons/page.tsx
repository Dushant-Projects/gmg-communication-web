import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CouponsManager } from "@/features/admin/coupons-manager";

export const metadata: Metadata = { title: "Admin · Coupons" };

export default async function AdminCouponsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Coupons</h1>
      <div className="mt-5"><CouponsManager initial={data ?? []} /></div>
    </div>
  );
}
