import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SimpleForm } from "@/features/auth/components/simple-form";
import { updatePassword } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
      <section className="mt-6 max-w-md">
        <h2 className="font-bold">Change password</h2>
        <SimpleForm action={updatePassword} field="password" label="New password (8+ characters)" button="Update password" />
      </section>
      {profile?.role === "admin" && (
        <Link href="/admin" className="mt-8 inline-block rounded-full border border-ink px-6 py-3 text-sm font-bold hover:bg-ink hover:text-white">Open admin dashboard</Link>
      )}
    </div>
  );
}
