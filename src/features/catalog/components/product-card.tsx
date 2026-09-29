import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { stockLabel, type CardProduct } from "@/features/catalog/queries";
import { Stars } from "./stars";
import { AddToCartButton, WishlistButton } from "./card-actions";
import { HoverGallery } from "./hover-gallery";

export function ProductCard({ p }: { p: CardProduct }) {
  const stock = stockLabel(p.stock, p.lowStock);
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <WishlistButton productId={p.id} className="absolute right-5 top-5 z-10" />
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative">
          <HoverGallery images={p.images.length ? p.images : p.image ? [p.image] : []} alt={p.name} />
          {p.discountPct > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-white">
              -{p.discountPct}%
            </span>
          )}
        </div>
        <p className="mt-3 text-xs font-semibold text-muted">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-bold leading-snug transition-colors group-hover:text-accent">{p.name}</h3>
      </Link>
      <div className="mt-1"><Stars rating={p.rating} count={p.ratingCount} /></div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-base font-extrabold">
          {p.hasVariants && <span className="mr-1 text-xs font-medium text-muted">From</span>}
          {formatPrice(p.salePrice ?? p.price)}
        </span>
        {p.salePrice != null && <span className="text-xs text-muted line-through">{formatPrice(p.price)}</span>}
      </div>
      <p className={`mt-1 text-xs font-semibold ${stock.tone}`}>{stock.text}</p>
      <AddToCartButton productId={p.id} slug={p.slug} hasVariants={p.hasVariants} stock={p.stock} />
    </article>
  );
}
