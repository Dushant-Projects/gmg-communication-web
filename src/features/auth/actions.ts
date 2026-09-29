"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export type AuthState = { error?: string; message?: string } | undefined;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? "http://localhost:3000";
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData, "next"), "/");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed")
      return { error: "Please confirm your email first. Check your inbox and spam folder for the confirmation link." };
    return { error: "Incorrect email or password." };
  }

  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData, "next"), "/");

  if (!fullName || !email) return { error: "Enter your name and email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit")
      return { error: "Too many emails were sent recently. Please wait a few minutes and try again." };
    return { error: "We couldn't create your account. Try a different email." };
  }

  // Email confirmation ON: no session yet
  if (!data.session) return { message: "Check your email and confirm your account to continue." };

  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(str(formData, "next"), "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email");
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Same message whether or not the email exists (no account enumeration)
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Reset link expired. Request a new one." };

  redirect("/account");
}
