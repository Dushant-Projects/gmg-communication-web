export const PRODUCT_CARD_SELECT =
  "id,name,slug,price,sale_price,effective_price,discount_pct,stock,low_stock_threshold,rating_avg,rating_count,brands(name,slug),product_images(url,is_primary,sort_order),product_variants(id,is_active)";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  discountPct: number;
  stock: number;
  lowStock: number;
  rating: number;
  ratingCount: number;
  hasVariants: boolean;
  images: string[];
};

export function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export function sortImages(images: any[] | null | undefined) {
  return [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
}

export function primaryImage(images: any[] | null | undefined): string | null {
  return sortImages(images)[0]?.url ?? null;
}

export function toCard(p: any): CardProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: one<any>(p.brands)?.name ?? null,
    image: primaryImage(p.product_images),
    price: Number(p.price),
    salePrice: p.sale_price != null ? Number(p.sale_price) : null,
    discountPct: p.discount_pct ?? 0,
    stock: p.stock ?? 0,
    lowStock: p.low_stock_threshold ?? 5,
    rating: Number(p.rating_avg ?? 0),
    ratingCount: p.rating_count ?? 0,
    hasVariants: (p.product_variants ?? []).some((v: any) => v.is_active),
    images: sortImages(p.product_images).map((img: any) => img.url).slice(0, 5),
  };
}

export function stockLabel(stock: number, lowStock: number) {
  if (stock <= 0) return { text: "Out of stock", tone: "text-sale" };
  if (stock <= lowStock) return { text: `Only ${stock} left`, tone: "text-amber-600" };
  return { text: "In stock", tone: "text-green-700" };
}
