import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BrandsManager } from "@/features/admin/brands-manager";

export const metadata: Metadata = { title: "Admin · Brands" };

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Brands</h1>
      <div className="mt-5"><BrandsManager initial={data ?? []} /></div>
    </div>
  );
}
