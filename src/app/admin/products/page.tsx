import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { one, primaryImage } from "@/features/catalog/queries";
import { formatPrice } from "@/lib/utils";
import { ToggleActive, DeleteProductButton, EditLink } from "@/features/admin/product-row-actions";

export const metadata: Metadata = { title: "Admin · Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id,name,sku,price,sale_price,stock,low_stock_threshold,is_active,is_featured,brands(name),product_images(url,is_primary,sort_order)")
    .order("created_at", { ascending: false });
  if (q?.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data } = await query;
  const products = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">+ Add product</Link>
      </div>

      <form className="mt-4"><input name="q" defaultValue={q ?? ""} placeholder="Search products…" className="h-11 w-full max-w-sm rounded-full border border-line px-4 text-sm outline-none focus:border-ink sm:w-72" /></form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold uppercase text-muted">
              <th className="p-3">Product</th><th className="p-3">Brand</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => {
              const img = primaryImage(p.product_images);
              const brand = one<any>(p.brands);
              const low = p.stock <= p.low_stock_threshold;
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="flex items-center gap-3 p-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">{img && <Image src={img} alt="" fill sizes="40px" className="object-cover" />}</div>
                    <span className="font-semibold">{p.name}{p.is_featured && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold">Featured</span>}</span>
                  </td>
                  <td className="p-3 text-muted">{brand?.name ?? "—"}</td>
                  <td className="p-3">{formatPrice(p.sale_price ?? p.price)}{p.sale_price && <span className="ml-1 text-xs text-muted line-through">{formatPrice(p.price)}</span>}</td>
                  <td className="p-3"><span className={low ? "font-bold text-sale" : ""}>{p.stock}</span></td>
                  <td className="p-3"><ToggleActive id={p.id} active={p.is_active} /></td>
                  <td className="p-3"><div className="flex gap-3"><EditLink id={p.id} /><DeleteProductButton id={p.id} name={p.name} /></div></td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">No products found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
