import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/features/admin/product-form";
import { sortImages } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Admin · Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: brands }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, product_images(id,url,public_id,is_primary,sort_order,color), product_variants(id,color,storage,ram,price,sale_price,stock,is_active)").eq("id", id).maybeSingle(),
    supabase.from("brands").select("id,name").eq("is_active", true).order("name"),
    supabase.from("categories").select("id,name").eq("is_active", true).order("name"),
  ]);
  if (!product) notFound();

  const initial = {
    id: product.id, name: product.name, slug: product.slug, model: product.model, brand_id: product.brand_id, category_id: product.category_id,
    description: product.description, price: Number(product.price), sale_price: product.sale_price != null ? Number(product.sale_price) : null,
    cost_price: Number(product.cost_price ?? 0),
    sale_ends_at: product.sale_ends_at ?? null,
    sku: product.sku, stock: product.stock, low_stock_threshold: product.low_stock_threshold, specifications: product.specifications ?? {},
    is_featured: product.is_featured, is_active: product.is_active, video_url: product.video_url ?? null,
    images: sortImages(product.product_images).map((img: any) => ({ key: img.id, id: img.id, url: img.url, publicId: img.public_id, color: img.color })),
    variants: (product.product_variants ?? []).map((v: any) => ({
      key: v.id, id: v.id, color: v.color ?? "", storage: v.storage ?? "", ram: v.ram ?? "",
      price: String(v.price), sale_price: v.sale_price != null ? String(v.sale_price) : "", stock: String(v.stock), is_active: v.is_active,
    })),
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Edit product</h1>
      <div className="mt-5"><ProductForm brands={brands ?? []} categories={categories ?? []} initial={initial} /></div>
    </div>
  );
}
