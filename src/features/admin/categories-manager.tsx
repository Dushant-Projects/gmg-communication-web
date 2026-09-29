"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import { SingleImageUpload } from "./single-image-upload";

type Category = { id: string; name: string; slug: string; image_url: string | null; is_active: boolean };
const EMPTY = { name: "", slug: "", image_url: null as string | null };
const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink";

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Category[]>(initial);
  const [editing, setEditing] = useState<string | null>(null); // id | "new" | null
  const [f, setF] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setList((data ?? []) as Category[]);
  };

  const open = (c?: Category) => {
    setError(null);
    setSlugTouched(!!c);
    setEditing(c ? c.id : "new");
    setF(c ? { name: c.name, slug: c.slug, image_url: c.image_url } : EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const row = { name: f.name.trim(), slug: f.slug.trim(), image_url: f.image_url };
    const { error: err } = editing === "new"
      ? await supabase.from("categories").insert(row)
      : await supabase.from("categories").update(row).eq("id", editing!);
    setBusy(false);
    if (err) return setError(err.code === "23505" ? "That name or slug is already used." : "We couldn't save this category.");
    setEditing(null);
    await reload();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? Products in this category will become uncategorized.`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    await reload();
  };

  const toggle = async (c: Category) => {
    await supabase.from("categories").update({ is_active: !c.is_active }).eq("id", c.id);
    await reload();
  };

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold">{c.name}</p>
              <button onClick={() => toggle(c)} className={cn("rounded-full px-3 py-1 text-xs font-bold", c.is_active ? "bg-green-50 text-green-700" : "bg-mist text-muted")}>
                {c.is_active ? "Active" : "Hidden"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">/{c.slug}</p>
            <div className="mt-3 flex gap-3 text-xs font-bold">
              <button onClick={() => open(c)} className="hover:underline">Edit</button>
              <button onClick={() => remove(c)} className="text-sale hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-4 max-w-md space-y-3 rounded-2xl border border-line bg-white p-4">
          <input required value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }); }} placeholder="Category name" className={input} />
          <input required value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} placeholder="Slug" className={input} />
          <SingleImageUpload url={f.image_url} onChange={(url) => setF({ ...f, image_url: url })} folder="categories" />
          {error && <p role="alert" className="text-sm text-sale">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-full border border-line px-6 text-sm font-bold">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => open()} className="mt-4 h-11 rounded-full border border-ink px-6 text-sm font-bold hover:bg-ink hover:text-white">+ Add category</button>
      )}
    </div>
  );
}
