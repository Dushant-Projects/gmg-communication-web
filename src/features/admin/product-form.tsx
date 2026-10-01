"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import { ImageUploader, type ImageItem } from "./image-uploader";
import { VideoUploader } from "./video-uploader";
import { SpecEditor, type SpecRow } from "./spec-editor";
import { VariantEditor, emptyVariant, type VariantRow } from "./variant-editor";

type Option = { id: string; name: string };
export type ProductInitial = {
  id: string; name: string; slug: string; model: string | null; brand_id: string | null; category_id: string | null;
  description: string | null; price: number; sale_price: number | null; sale_ends_at?: string | null; cost_price: number; sku: string | null; stock: number;
  low_stock_threshold: number; specifications: Record<string, string> | null; is_featured: boolean; is_active: boolean; video_url: string | null;
  images: ImageItem[]; variants: VariantRow[];
};

const input = "h-11 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10";
const label = "block text-sm font-bold";

// datetime-local works in the admin's own timezone; the database stores UTC.
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ProductForm({ brands, categories, initial }: { brands: Option[]; categories: Option[]; initial?: ProductInitial }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [model, setModel] = useState(initial?.model ?? "");
  const [brandId, setBrandId] = useState(initial?.brand_id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [salePrice, setSalePrice] = useState(initial?.sale_price != null ? String(initial.sale_price) : "");
  const [saleEnds, setSaleEnds] = useState("");
  const initialSaleEnds = useRef("");
  const saleEndsInput = useRef<HTMLInputElement>(null);
  // filled after mount so the server (UTC) and browser timezones never disagree
  useEffect(() => {
    const v = toLocalInput(initial?.sale_ends_at);
    initialSaleEnds.current = v;
    setSaleEnds(v);
  }, [initial?.sale_ends_at]);
  const [costPrice, setCostPrice] = useState(initial ? String(initial.cost_price) : "0");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "0");
  const [lowStock, setLowStock] = useState(initial ? String(initial.low_stock_threshold) : "5");
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<ImageItem[]>(initial?.images ?? []);
  const [specs, setSpecs] = useState<SpecRow[]>(Object.entries(initial?.specifications ?? {}).map(([key, value]) => ({ key, value: String(value) })));
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants ?? []);
  const [videoUrl, setVideoUrl] = useState<string | null>(initial?.video_url ?? null);
  const hasVariants = variants.length > 0;
  const availableColors = [...new Set(variants.map((v) => v.color.trim()).filter(Boolean))];

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onName = (v: string) => { setName(v); if (!slugTouched) setSlug(slugify(v)); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const p = Number(price);
    const sp = salePrice ? Number(salePrice) : null;
    if (!name.trim() || !slug.trim()) return setError("Name and slug are required.");
    if (!(p > 0)) return setError("Enter a valid price.");
    if (sp != null && sp >= p) return setError("Sale price must be less than the regular price.");
    if (hasVariants) {
      for (const v of variants) {
        const vp = Number(v.price), vsp = v.sale_price ? Number(v.sale_price) : null;
        if (!(vp > 0) || !(Number(v.stock) >= 0)) return setError("Every variant needs a valid price and stock.");
        if (vsp != null && vsp >= vp) return setError("A variant's sale price must be less than its price.");
      }
    } else if (!(Number(stock) >= 0)) {
      return setError("Enter a valid stock quantity.");
    }

    if (saleEndsInput.current?.validity.badInput) return setError("Sale end date is incomplete. Pick the full date and time, or clear the field.");

    const hasAnySale = sp != null || variants.some((v) => !!v.sale_price);
    const endsMs = saleEnds ? new Date(saleEnds).getTime() : null;
    const endsDirty = saleEnds !== initialSaleEnds.current;
    if (endsMs != null && Number.isNaN(endsMs)) return setError("Enter a valid sale end date.");
    if (endsMs != null && !hasAnySale) return setError("Add a sale price before setting a sale end date.");
    if (endsMs != null && endsDirty && endsMs <= Date.now()) return setError("Sale end date must be in the future.");
    const saleEndsAt = !hasAnySale || endsMs == null
      ? null
      : endsDirty ? new Date(endsMs).toISOString() : (initial?.sale_ends_at ?? null);

    setBusy(true);
    const payload = {
      name: name.trim(), slug: slug.trim(), model: model.trim() || null,
      brand_id: brandId || null, category_id: categoryId || null,
      description: description.trim() || null, price: p, sale_price: sp, sale_ends_at: saleEndsAt, cost_price: Number(costPrice) || 0,
      sku: sku.trim() || null, low_stock_threshold: Number(lowStock) || 5,
      specifications: Object.fromEntries(specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])),
      is_featured: featured, is_active: active, video_url: videoUrl,
      ...(hasVariants ? {} : { stock: Number(stock) }),
    };

    let productId = initial?.id;
    const { data: saved, error: saveErr } = isEdit
      ? await supabase.from("products").update(payload).eq("id", productId!).select("id").single()
      : await supabase.from("products").insert({ ...payload, stock: hasVariants ? 0 : Number(stock) }).select("id").single();

    if (saveErr || !saved) {
      setBusy(false);
      if (saveErr?.code === "23505") return setError(saveErr.message.includes("sku") ? "This SKU is already used." : "This slug is already used. Try a different one.");
      return setError("We couldn't save this product. Please try again.");
    }
    productId = saved.id;

    // ---- variants: delete removed, update existing, insert new ----
    const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
    if (isEdit) {
      const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", productId);
      const toDelete = (existing ?? []).map((r: any) => r.id).filter((id: string) => !keepIds.has(id));
      if (toDelete.length) await supabase.from("product_variants").delete().in("id", toDelete);
    }
    for (const v of variants) {
      const row = {
        product_id: productId, color: v.color.trim() || null, storage: v.storage.trim() || null, ram: v.ram.trim() || null,
        price: Number(v.price), sale_price: v.sale_price ? Number(v.sale_price) : null, stock: Number(v.stock), is_active: v.is_active,
      };
      if (v.id) await supabase.from("product_variants").update(row).eq("id", v.id);
      else await supabase.from("product_variants").insert(row);
    }

    // ---- images: delete removed, replace the rest in order ----
    if (isEdit) await supabase.from("product_images").delete().eq("product_id", productId);
    if (images.length) {
      await supabase.from("product_images").insert(
        images.map((img, i) => ({ product_id: productId, url: img.url, public_id: img.publicId ?? null, sort_order: i, is_primary: i === 0, color: img.color || null }))
      );
    }

    setBusy(false);
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-8">
      <section>
        <h2 className="font-extrabold">Basics</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={label}>Product name</span><input required value={name} onChange={(e) => onName(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Slug</span><input required value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Model</span><input value={model} onChange={(e) => setModel(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Brand</span>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={cn(input, "mt-1")}>
              <option value="">No brand</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label><span className={label}>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={cn(input, "mt-1")}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2"><span className={label}>Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink" /></label>
        </div>
      </section>

      <section>
        <h2 className="font-extrabold">Pricing & stock</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label><span className={label}>Price (PKR)</span><input required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Sale price (optional)</span><input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label className="sm:col-span-2"><span className={label}>Sale ends on (optional)</span><input ref={saleEndsInput} type="datetime-local" value={saleEnds} onChange={(e) => setSaleEnds(e.target.value)} className={cn(input, "mt-1")} /><span className="mt-1 block text-xs text-muted">Shows a real countdown on the product page. Leave empty for the auto-restarting timer. When the date passes, the timer hides and the sale price is removed automatically.</span></label>
          <label><span className={label}>Cost price (optional)</span><input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={cn(input, "mt-1")} /><span className="mt-1 block text-xs text-muted">Not shown to customers. Used for the profit/loss numbers on the dashboard.</span></label>
          <label><span className={label}>SKU</span><input value={sku} onChange={(e) => setSku(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Low stock alert below</span><input type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} className={cn(input, "mt-1")} /></label>
          <label><span className={label}>Stock{hasVariants && " (managed by variants)"}</span>
            <input type="number" min={0} value={hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : stock} disabled={hasVariants} onChange={(e) => setStock(e.target.value)} className={cn(input, "mt-1", hasVariants && "bg-mist text-muted")} />
          </label>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between"><h2 className="font-extrabold">Variants</h2></div>
        <p className="mt-1 text-xs text-muted">Add variants for phones with color/storage/RAM options. Leave empty for simple products like cables or chargers.</p>
        <div className="mt-3"><VariantEditor rows={variants} onChange={setVariants} /></div>
      </section>

      <section>
        <h2 className="font-extrabold">Images</h2>
        <div className="mt-3"><ImageUploader images={images} onChange={setImages} colors={availableColors} /></div>
      </section>

      <section>
        <h2 className="font-extrabold">Video (optional)</h2>
        <div className="mt-3"><VideoUploader url={videoUrl} onChange={setVideoUrl} /></div>
      </section>

      <section>
        <h2 className="font-extrabold">Specifications</h2>
        <div className="mt-3"><SpecEditor rows={specs} onChange={setSpecs} /></div>
      </section>

      <section className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-ink" /> Featured</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-ink" /> Active (visible in store)</label>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-sale">{error}</p>}

      <div className="flex gap-3">
        <button disabled={busy} className="h-12 rounded-full bg-ink px-7 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : isEdit ? "Save changes" : "Create product"}</button>
        <button type="button" onClick={() => router.push("/admin/products")} className="h-12 rounded-full border border-line px-7 text-sm font-bold">Cancel</button>
      </div>
    </form>
  );
}
export { emptyVariant };
