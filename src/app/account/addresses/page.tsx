import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AddressManager } from "@/features/account/address-manager";

export const metadata: Metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id)
    .order("is_default", { ascending: false }).order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Addresses</h1>
      <div className="mt-6"><AddressManager userId={user!.id} initial={(data ?? []) as any} /></div>
    </div>
  );
}
