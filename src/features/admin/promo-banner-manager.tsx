"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Banner = { id: string; title: string | null; subtitle: string | null; ends_at: string | null; href: string | null; is_active: boolean };

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

export function PromoBannerManager({ initial }: { initial: Banner }) {
  const [f, setF] = useState({
    title: initial.title ?? "", subtitle: initial.subtitle ?? "", ends_at: toLocalInput(initial.ends_at),
    href: initial.href ?? "", is_active: initial.is_active,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await createClient().from("promo_banner").update({
      title: f.title.trim() || null, subtitle: f.subtitle.trim() || null,
      ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
      href: f.href.trim() || null, is_active: f.is_active,
    }).eq("id", "main");
    setBusy(false);
    setMsg(error ? { ok: false, text: "We couldn't save this banner." } : { ok: true, text: "Saved." });
  };

  return (
    <form onSubmit={save} className="max-w-lg space-y-3 rounded-2xl border border-line bg-white p-5">
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="h-4 w-4 accent-ink" />
        Show on homepage
      </label>
      <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title, e.g. Back to School Sale" className={input} />
      <input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} placeholder="Subtitle, e.g. Save on select smartphones" className={input} />
      <label className="block text-xs font-bold text-muted">
        Offer ends at
        <input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} className={cn(input, "mt-1 font-normal text-ink")} />
      </label>
      <input value={f.href} onChange={(e) => setF({ ...f, href: e.target.value })} placeholder="Link when clicked, e.g. /shop?deals=1" className={input} />
      {msg && <p role="status" className={cn("text-sm", msg.ok ? "text-green-700" : "text-sale")}>{msg.text}</p>}
      <button disabled={busy} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
      <p className="text-xs text-muted">The countdown clears itself once the end time passes — come back and set a new one for the next sale.</p>
    </form>
  );
}
