import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const [{ data: profile }, { data: addresses }, { data: paymentSettings }] = await Promise.all([
    supabase.from("profiles").select("full_name,email,phone").eq("id", user.id).single(),
    supabase.from("addresses").select("id,full_name,phone,address,city,area,postal_code")
      .eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("payment_settings").select("method,display_name,account_title,account_number,iban,qr_image_url,instructions")
      .eq("is_active", true).order("method"),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm
        userId={user.id}
        profile={{ full_name: profile?.full_name ?? "", email: profile?.email ?? user.email ?? "", phone: profile?.phone ?? "" }}
        addresses={(addresses ?? []) as any}
        paymentSettings={paymentSettings ?? []}
      />
    </main>
  );
}
