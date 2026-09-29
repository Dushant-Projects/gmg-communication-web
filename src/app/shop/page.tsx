import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CARD_SELECT, toCard } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Shop Smartphones & Accessories" };

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const first = (v: string | string[] | undefined) => list(v)[0];
const NONE = "00000000-0000-0000-0000-000000000000";
const PAGE_SIZE = 12;
const sizeGb = (s: string) => (s.toUpperCase().includes("TB") ? parseFloat(s) * 1024 : parseFloat(s));
const uniq = (a: (string | null)[]) => [...new Set(a.filter(Boolean))] as string[];

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const q = (first(sp.q) ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
  const brandSlugs = list(sp.brand);
  const category = first(sp.category);
  const group = first(sp.group);
  const rams = list(sp.ram), storages = list(sp.storage), colors = list(sp.color);
  const min = Number(first(sp.min)) || 0;
  const max = Number(first(sp.max)) || 0;
  const rating = Number(first(sp.rating)) || 0;
  const inStock = first(sp.stock) === "1";
  const deals = first(sp.deals) === "1";
  const sort = first(sp.sort) ?? "featured";
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const [{ data: brands }, { data: categories }, { data: variantRows }] = await Promise.all([
    supabase.from("brands").select("id,name,slug").eq("is_active", true).order("name"),
    supabase.from("categories").select("id,name,slug").eq("is_active", true).order("name"),
    supabase.from("product_variants").select("ram,storage,color").eq("is_active", true),
  ]);
  const B = (brands ?? []) as any[];
  const C = (categories ?? []) as any[];
  const V = (variantRows ?? []) as any[];

  const ramOpts = uniq(V.map((v) => v.ram)).sort((a, b) => sizeGb(a) - sizeGb(b));
  const storageOpts = uniq(V.map((v) => v.storage)).sort((a, b) => sizeGb(a) - sizeGb(b));
  const colorOpts = uniq(V.map((v) => v.color)).sort();

  // variant filters -> product ids
  let idFilter: string[] | null = null;
  if (rams.length || storages.length || colors.length) {
    let vq = supabase.from("product_variants").select("product_id").eq("is_active", true);
    if (rams.length) vq = vq.in("ram", rams);
    if (storages.length) vq = vq.in("storage", storages);
    if (colors.length) vq = vq.in("color", colors);
    const { data } = await vq;
    idFilter = [...new Set((data ?? []).map((r: any) => r.product_id))] as string[];
  }

  let query = supabase.from("products").select(PRODUCT_CARD_SELECT, { count: "exact" }).eq("is_active", true);

  if (idFilter) query = query.in("id", idFilter.length ? idFilter : [NONE]);
  if (brandSlugs.length) {
    const ids = B.filter((b) => brandSlugs.includes(b.slug)).map((b) => b.id);
    query = query.in("brand_id", ids.length ? ids : [NONE]);
  }
  if (category) {
    const c = C.find((x) => x.slug === category);
    query = query.eq("category_id", c?.id ?? NONE);
  } else if (group === "accessories") {
    const ids = C.filter((c) => c.slug !== "smartphones").map((c) => c.id);
    query = query.in("category_id", ids.length ? ids : [NONE]);
  }
  if (deals) query = query.not("sale_price", "is", null);
  if (inStock) query = query.gt("stock", 0);
  if (min > 0) query = query.gte("effective_price", min);
  if (max > 0) query = query.lte("effective_price", max);
  if (rating > 0) query = query.gte("rating_avg", rating);

  // every search word must match name / model / brand / category
  for (const tok of q.split(/\s+/).filter(Boolean).slice(0, 5)) {
    const t = tok.toLowerCase();
    const parts = [`name.ilike.%${tok}%`, `model.ilike.%${tok}%`];
    const bIds = B.filter((b) => b.name.toLowerCase().includes(t)).map((b) => b.id);
    const cIds = C.filter((c) => c.name.toLowerCase().includes(t)).map((c) => c.id);
    if (bIds.length) parts.push(`brand_id.in.(${bIds.join(",")})`);
    if (cIds.length) parts.push(`category_id.in.(${cIds.join(",")})`);
    query = query.or(parts.join(","));
  }

  switch (sort) {
    case "newest": query = query.order("created_at", { ascending: false }); break;
    case "price_asc": query = query.order("effective_price", { ascending: true }); break;
    case "price_desc": query = query.order("effective_price", { ascending: false }); break;
    case "rating": query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false }); break;
    case "discount": query = query.order("discount_pct", { ascending: false }); break;
    default: query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const products = (data ?? []).map(toCard);
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of list(v)) if (k !== "page") p.append(k, x);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  const title = q ? `Results for “${q}”` : deals ? "Best deals" : category ? (C.find((c) => c.slug === category)?.name ?? "Shop") : group === "accessories" ? "Accessories" : "Shop";

  const Check = ({ name, value, checked }: { name: string; value: string; checked: boolean }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-ink" /> {value}
    </label>
  );
  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <fieldset><legend className="mb-2 text-sm font-bold">{label}</legend><div className="space-y-2">{children}</div></fieldset>
  );
  const field = "h-10 w-full rounded-lg border border-line px-3 text-sm";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{total} {total === 1 ? "product" : "products"}</p>
        </div>
        <SortSelect value={sort} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div>
          <input id="filter-toggle" type="checkbox" className="peer sr-only" />
          <label htmlFor="filter-toggle" className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-ink text-sm font-bold lg:hidden">
            Filters
          </label>
          <form action="/shop" className="mt-4 hidden space-y-6 rounded-2xl border border-line p-4 peer-checked:block lg:mt-0 lg:block">
            {q && <input type="hidden" name="q" value={q} />}
            <input type="hidden" name="sort" value={sort} />
            {deals && <input type="hidden" name="deals" value="1" />}
            {group && <input type="hidden" name="group" value={group} />}

            <Group label="Category">
              <select name="category" defaultValue={category ?? ""} className={field}>
                <option value="">All categories</option>
                {C.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Group>
            <Group label="Brand">
              {B.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="brand" value={b.slug} defaultChecked={brandSlugs.includes(b.slug)} className="h-4 w-4 accent-ink" /> {b.name}
                </label>
              ))}
            </Group>
            <Group label="Price (PKR)">
              <div className="flex gap-2">
                <input name="min" type="number" min={0} placeholder="Min" defaultValue={min || ""} className={field} />
                <input name="max" type="number" min={0} placeholder="Max" defaultValue={max || ""} className={field} />
              </div>
            </Group>
            <Group label="Rating">
              {[["", "Any"], ["4", "4★ & up"], ["3", "3★ & up"]].map(([v, l]) => (
                <label key={l} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="rating" value={v} defaultChecked={String(rating || "") === v} className="h-4 w-4 accent-ink" /> {l}
                </label>
              ))}
            </Group>
            <Group label="Availability">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="stock" value="1" defaultChecked={inStock} className="h-4 w-4 accent-ink" /> In stock only
              </label>
            </Group>
            {ramOpts.length > 0 && <Group label="RAM">{ramOpts.map((r) => <Check key={r} name="ram" value={r} checked={rams.includes(r)} />)}</Group>}
            {storageOpts.length > 0 && <Group label="Storage">{storageOpts.map((s) => <Check key={s} name="storage" value={s} checked={storages.includes(s)} />)}</Group>}
            {colorOpts.length > 0 && <Group label="Color">{colorOpts.map((c) => <Check key={c} name="color" value={c} checked={colors.includes(c)} />)}</Group>}

            <div className="flex gap-2">
              <button className="h-11 flex-1 rounded-full bg-ink text-sm font-bold text-white">Apply filters</button>
              <Link href="/shop" className="flex h-11 items-center rounded-full border border-line px-4 text-sm font-bold">Clear</Link>
            </div>
          </form>
        </div>

        <div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-20 text-center">
              <p className="text-lg font-bold">No products found</p>
              <p className="mt-1 text-sm text-muted">Try a different search or remove some filters.</p>
              <Link href="/shop" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">Clear all filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 md:gap-5">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-3 text-sm font-bold" aria-label="Pagination">
              {page > 1 && <Link href={hrefFor(page - 1)} className="rounded-full border border-line px-5 py-2.5 hover:border-ink">Previous</Link>}
              <span className="text-muted">Page {page} of {pages}</span>
              {page < pages && <Link href={hrefFor(page + 1)} className="rounded-full border border-line px-5 py-2.5 hover:border-ink">Next</Link>}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
