"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ userId, email, fullName, phone }: { userId: string; email: string; fullName: string; phone: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [tel, setTel] = useState(phone);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cls = "h-12 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClient().from("profiles").update({ full_name: name.trim(), phone: tel.trim() || null }).eq("id", userId);
    setBusy(false);
    setMsg(error ? { ok: false, text: "We couldn't save your changes. Please try again." } : { ok: true, text: "Profile updated." });
    if (!error) router.refresh();
  };

  return (
    <form onSubmit={save} className="max-w-md space-y-3">
      <label className="block text-sm font-bold">Full name<input required value={name} onChange={(e) => setName(e.target.value)} className={`${cls} mt-1 font-normal`} /></label>
      <label className="block text-sm font-bold">Phone<input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" className={`${cls} mt-1 font-normal`} /></label>
      <label className="block text-sm font-bold">Email<input value={email} disabled className={`${cls} mt-1 bg-mist font-normal text-muted`} /></label>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-green-700" : "text-sale"}`}>{msg.text}</p>}
      <button disabled={busy} className="h-12 rounded-full bg-ink px-7 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
