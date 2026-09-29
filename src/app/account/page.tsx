import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/account/profile-form";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name,email,phone").eq("id", user!.id).single();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
      <div className="mt-6">
        <ProfileForm userId={user!.id} email={profile?.email ?? user!.email ?? ""} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
      </div>
    </div>
  );
}
