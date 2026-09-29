import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PaymentSettingsManager } from "@/features/admin/payment-settings-manager";

export const metadata: Metadata = { title: "Admin · Payment Settings" };

export default async function AdminPaymentSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("payment_settings").select("*").order("method");
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Payment settings</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        These account numbers and QR codes are shown to customers at checkout and on their order page. This is temporary,
        until a real payment gateway is connected.
      </p>
      <div className="mt-5"><PaymentSettingsManager initial={data ?? []} /></div>
    </div>
  );
}
