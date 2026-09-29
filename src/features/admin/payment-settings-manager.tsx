"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SingleImageUpload } from "./single-image-upload";

type Setting = {
  id: string; method: string; display_name: string; account_title: string | null;
  account_number: string | null; iban: string | null; qr_image_url: string | null; instructions: string | null; is_active: boolean;
};
const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

function Card({ setting, onSaved }: { setting: Setting; onSaved: (s: Setting) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [f, setF] = useState({
    account_title: setting.account_title ?? "", account_number: setting.account_number ?? "",
    iban: setting.iban ?? "", qr_image_url: setting.qr_image_url, instructions: setting.instructions ?? "", is_active: setting.is_active,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data, error } = await supabase.from("payment_settings").update({
      account_title: f.account_title.trim() || null, account_number: f.account_number.trim() || null,
      iban: f.iban.trim() || null, qr_image_url: f.qr_image_url, instructions: f.instructions.trim() || null, is_active: f.is_active,
    }).eq("id", setting.id).select("*").single();
    setBusy(false);
    if (error || !data) { setMsg({ ok: false, text: "We couldn't save these details." }); return; }
    setMsg({ ok: true, text: "Saved." });
    onSaved(data as Setting);
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{setting.display_name}</h3>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="h-4 w-4 accent-ink" /> Show at checkout
        </label>
      </div>
      <input value={f.account_title} onChange={(e) => setF({ ...f, account_title: e.target.value })} placeholder="Account title" className={input} />
      <input value={f.account_number} onChange={(e) => setF({ ...f, account_number: e.target.value })} placeholder={setting.method === "bank_transfer" ? "Account number" : "Mobile number"} className={input} />
      {setting.method === "bank_transfer" && <input value={f.iban} onChange={(e) => setF({ ...f, iban: e.target.value })} placeholder="IBAN" className={input} />}
      <div>
        <p className="mb-1 text-xs font-bold text-muted">QR code (optional)</p>
        <SingleImageUpload url={f.qr_image_url} onChange={(url) => setF({ ...f, qr_image_url: url })} folder="payment" />
      </div>
      <textarea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} rows={2} placeholder="Instructions shown to customers" className="w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink" />
      {msg && <p role="status" className={cn("text-sm", msg.ok ? "text-green-700" : "text-sale")}>{msg.text}</p>}
      <button disabled={busy} className="h-10 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function PaymentSettingsManager({ initial }: { initial: Setting[] }) {
  const [list, setList] = useState(initial);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => (
        <Card key={s.id} setting={s} onSaved={(updated) => setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))} />
      ))}
    </div>
  );
}
