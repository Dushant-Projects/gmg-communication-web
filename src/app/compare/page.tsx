import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { one, primaryImage } from "@/features/catalog/queries";
import { Stars } from "@/features/catalog/components/stars";

export const metadata: Metadata = { title: "Compare Products" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  if (idList.length < 2) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Scale size={36} className="mx-auto text-line" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Nothing to compare yet</h1>
        <p className="mt-2 text-muted">Pick at least 2 products from the shop using the compare icon on each product card.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Browse products</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,slug,price,sale_price,stock,rating_avg,rating_count,specifications,brands(name),product_images(url,is_primary,sort_order)")
    .in("id", idList)
    .eq("is_active", true);

  const products = idList.map((id) => (data ?? []).find((p: any) => p.id === id)).filter(Boolean) as any[];

  if (products.length < 2) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">These products are no longer available to compare</h1>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Browse products</Link>
      </main>
    );
  }

  const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.specifications ?? {})))];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Compare Products</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="w-40"></th>
              {products.map((p) => {
                const brand = one<any>(p.brands);
                const img = primaryImage(p.product_images);
                return (
                  <th key={p.id} className="border-b border-line p-4 text-left align-top">
                    <div className="relative aspect-square w-32 overflow-hidden rounded-xl bg-mist">
                      {img && <Image src={img} alt={p.name} fill sizes="128px" className="object-cover" />}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-muted">{brand?.name}</p>
                    <Link href={`/product/${p.slug}`} className="block text-sm font-bold hover:underline">{p.name}</Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-line">
              <td className="p-4 font-bold text-muted">Price</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 font-extrabold">
                  {formatPrice(p.sale_price ?? p.price)}
                  {p.sale_price && <span className="ml-2 text-xs font-normal text-muted line-through">{formatPrice(p.price)}</span>}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line">
              <td className="p-4 font-bold text-muted">Rating</td>
              {products.map((p) => (
                <td key={p.id} className="p-4"><Stars rating={Number(p.rating_avg)} count={p.rating_count} /></td>
              ))}
            </tr>
            <tr className="border-b border-line">
              <td className="p-4 font-bold text-muted">Availability</td>
              {products.map((p) => (
                <td key={p.id} className={`p-4 font-semibold ${p.stock > 0 ? "text-green-700" : "text-sale"}`}>{p.stock > 0 ? "In stock" : "Out of stock"}</td>
              ))}
            </tr>
            {specKeys.map((key) => (
              <tr key={key} className="border-b border-line">
                <td className="p-4 font-bold text-muted">{key}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-muted">{p.specifications?.[key] ?? "—"}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4"></td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  <Link href={`/product/${p.slug}`} className="inline-block rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-white hover:opacity-90">View Product</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
