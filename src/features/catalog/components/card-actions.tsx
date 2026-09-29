"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/features/store/store-provider";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const active = wishlist.has(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white", className)}
    >
      <Heart size={18} className={active ? "fill-sale text-sale" : "text-ink"} />
    </button>
  );
}

export function AddToCartButton({
  productId, slug, hasVariants, stock,
}: { productId: string; slug: string; hasVariants: boolean; stock: number }) {
  const { addToCart } = useStore();
  const base = "mt-3 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition";

  if (stock <= 0) return <button disabled className={cn(base, "cursor-not-allowed bg-mist text-muted")}>Out of stock</button>;
  if (hasVariants)
    return <Link href={`/product/${slug}`} className={cn(base, "border border-ink hover:bg-ink hover:text-white")}>Select options</Link>;
  return (
    <button onClick={() => addToCart({ productId, variantId: null, quantity: 1 })} className={cn(base, "bg-ink text-white hover:opacity-90")}>
      Add to Cart
    </button>
  );
}
