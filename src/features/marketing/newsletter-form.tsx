"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClient().from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (!error) { setStatus({ ok: true, text: "Thanks for subscribing!" }); setEmail(""); }
    else if (error.code === "23505") setStatus({ ok: true, text: "You're already subscribed." });
    else setStatus({ ok: false, text: "Something went wrong. Please try again." });
  };

  return (
    <div className="mx-auto mt-6 max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address" aria-label="Email address"
          className="h-12 flex-1 rounded-full border border-line bg-white px-5 text-sm outline-none focus:border-ink"
        />
        <button disabled={busy} className="h-12 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Please wait…" : "Subscribe"}
        </button>
      </form>
      {status && <p role="status" className={`mt-3 text-sm ${status.ok ? "text-green-700" : "text-sale"}`}>{status.text}</p>}
    </div>
  );
}
