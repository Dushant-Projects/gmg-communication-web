import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { one, primaryImage, sortImages } from "@/features/catalog/queries";
import { ProductInteractive } from "@/features/catalog/components/product-interactive";
import { ProductTabs } from "@/features/catalog/components/product-tabs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("products")
    .select("name,description,product_images(url,is_primary,sort_order)")
    .eq("slug", slug).eq("is_active", true).maybeSingle();

  if (!p) return { title: "Product not found" };
  const title = `${p.name} — Buy Online`;
  const description = (p.description ?? `Buy ${p.name} online.`).slice(0, 160);
  const img = primaryImage(p.product_images);
  return { title, description, openGraph: { title, description, images: img ? [img] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("products")
    .select("*, brands(name,slug), categories(name,slug), product_images(id,url,is_primary,sort_order,color), product_variants(id,color,storage,ram,price,sale_price,stock,is_active)")
    .eq("slug", slug).eq("is_active", true).maybeSingle();

  if (!p) notFound();

  const { data: reviews } = await supabase
    .from("reviews").select("id,rating,comment,created_at")
    .eq("product_id", p.id).eq("status", "approved")
    .order("created_at", { ascending: false }).limit(20);

  const brand = one<any>(p.brands);
  const category = one<any>(p.categories);
  const images = sortImages(p.product_images);
  const variants = (p.product_variants ?? []).map((v: any) => ({
    ...v, price: Number(v.price), sale_price: v.sale_price != null ? Number(v.sale_price) : null,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: images.map((i: any) => i.url),
    description: p.description ?? undefined,
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    sku: p.sku ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: Number(p.sale_price ?? p.price),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link>
        {category && <> / <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></>}
      </nav>

      <ProductInteractive
        product={{ id: p.id, price: Number(p.price), salePrice: p.sale_price != null ? Number(p.sale_price) : null, stock: p.stock, lowStock: p.low_stock_threshold }}
        variants={variants}
        images={images.map((img: any) => ({ url: img.url, color: img.color ?? null }))}
        videoUrl={p.video_url ?? null}
        brandName={brand?.name ?? null}
        brandSlug={brand?.slug ?? null}
        name={p.name}
        model={p.model}
        rating={Number(p.rating_avg)}
        ratingCount={p.rating_count}
      />

      <div className="mt-14">
        <ProductTabs
          description={p.description} specs={p.specifications ?? {}}
          reviews={reviews ?? []} rating={Number(p.rating_avg)} ratingCount={p.rating_count}
        />
      </div>
    </main>
  );
}
