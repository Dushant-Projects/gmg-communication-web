"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Address = { id: string; full_name: string; phone: string; address: string; city: string; area: string | null; postal_code: string | null; is_default: boolean };
const EMPTY = { full_name: "", phone: "", address: "", city: "", area: "", postal_code: "" };
const cls = "h-12 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

export function AddressManager({ userId, initial }: { userId: string; initial: Address[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Address[]>(initial);
  const [editing, setEditing] = useState<string | null>(null); // address id | "new" | null
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const reload = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", userId)
      .order("is_default", { ascending: false }).order("created_at", { ascending: false });
    setList((data ?? []) as Address[]);
  };

  const open = (a?: Address) => {
    setError(null);
    setEditing(a ? a.id : "new");
    setF(a ? { full_name: a.full_name, phone: a.phone, address: a.address, city: a.city, area: a.area ?? "", postal_code: a.postal_code ?? "" } : EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const values = { ...f, area: f.area || null, postal_code: f.postal_code || null };
    const { error: err } = editing === "new"
      ? await supabase.from("addresses").insert({ ...values, user_id: userId, is_default: list.length === 0 })
      : await supabase.from("addresses").update(values).eq("id", editing!);
    setBusy(false);
    if (err) { setError("We couldn't save this address. Please try again."); return; }
    setEditing(null);
    await reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    await reload();
  };

  const makeDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    await reload();
  };

  return (
    <div>
      {list.length === 0 && !editing && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">You haven&apos;t saved any addresses yet.</p>}

      <ul className="space-y-3">
        {list.map((a) => (
          <li key={a.id} className="rounded-2xl border border-line p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{a.full_name} {a.is_default && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs">Default</span>}</p>
                <p className="text-muted">{a.phone}</p>
                <p className="text-muted">{[a.address, a.area, a.city, a.postal_code].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs font-bold">
                <button onClick={() => open(a)} className="hover:underline">Edit</button>
                {!a.is_default && <button onClick={() => makeDefault(a.id)} className="hover:underline">Set default</button>}
                <button onClick={() => remove(a.id)} className="text-sale hover:underline">Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
          <input required value={f.full_name} onChange={set("full_name")} placeholder="Full name" className={cls} />
          <input required value={f.phone} onChange={set("phone")} placeholder="Phone" inputMode="tel" className={cls} />
          <input required value={f.address} onChange={set("address")} placeholder="Address" className={`${cls} sm:col-span-2`} />
          <input required value={f.city} onChange={set("city")} placeholder="City" className={cls} />
          <input value={f.area} onChange={set("area")} placeholder="Area" className={cls} />
          <input value={f.postal_code} onChange={set("postal_code")} placeholder="Postal code" className={cls} />
          {error && <p role="alert" className="text-sm text-sale sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save address"}</button>
            <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-6 text-sm font-bold">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => open()} className="mt-4 h-11 rounded-full border border-ink px-6 text-sm font-bold hover:bg-ink hover:text-white">Add address</button>
      )}
    </div>
  );
}
