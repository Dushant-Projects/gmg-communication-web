"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import { SingleImageUpload } from "./single-image-upload";

type Brand = { id: string; name: string; slug: string; logo_url: string | null; is_active: boolean };
const EMPTY = { name: "", slug: "", logo_url: null as string | null };
const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

export function BrandsManager({ initial }: { initial: Brand[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Brand[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const { data } = await supabase.from("brands").select("*").order("name");
    setList((data ?? []) as Brand[]);
  };

  const open = (b?: Brand) => {
    setError(null);
    setSlugTouched(!!b);
    setEditing(b ? b.id : "new");
    setF(b ? { name: b.name, slug: b.slug, logo_url: b.logo_url } : EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const row = { name: f.name.trim(), slug: f.slug.trim(), logo_url: f.logo_url };
    const { error: err } = editing === "new"
      ? await supabase.from("brands").insert(row)
      : await supabase.from("brands").update(row).eq("id", editing!);
    setBusy(false);
    if (err) return setError(err.code === "23505" ? "That name or slug is already used." : "We couldn't save this brand.");
    setEditing(null);
    await reload();
  };

  const remove = async (b: Brand) => {
    if (!confirm(`Delete "${b.name}"? Products from this brand will become unbranded.`)) return;
    await supabase.from("brands").delete().eq("id", b.id);
    await reload();
  };

  const toggle = async (b: Brand) => {
    await supabase.from("brands").update({ is_active: !b.is_active }).eq("id", b.id);
    await reload();
  };

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <li key={b.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">{b.logo_url && <Image src={b.logo_url} alt="" fill sizes="40px" className="object-contain" />}</div>
                <div><p className="font-bold">{b.name}</p><p className="text-xs text-muted">/{b.slug}</p></div>
              </div>
              <button onClick={() => toggle(b)} className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold", b.is_active ? "bg-green-50 text-green-700" : "bg-mist text-muted")}>
                {b.is_active ? "Active" : "Hidden"}
              </button>
            </div>
            <div className="mt-3 flex gap-3 text-xs font-bold">
              <button onClick={() => open(b)} className="hover:underline">Edit</button>
              <button onClick={() => remove(b)} className="text-sale hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-4 max-w-md space-y-3 rounded-2xl border border-line bg-white p-4">
          <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) })} placeholder="Brand name" className={input} />
          <input required value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} placeholder="Slug" className={input} />
          <SingleImageUpload url={f.logo_url} onChange={(url) => setF({ ...f, logo_url: url })} folder="brands" />
          {error && <p role="alert" className="text-sm text-sale">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-6 text-sm font-bold">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => open()} className="mt-4 h-11 rounded-full border border-ink px-6 text-sm font-bold hover:bg-ink hover:text-white">+ Add brand</button>
      )}
    </div>
  );
}
