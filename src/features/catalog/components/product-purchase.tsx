"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { MAX_QTY } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/features/store/store-provider";
import { stockLabel } from "@/features/catalog/queries";

export type Variant = {
  id: string; color: string | null; storage: string | null; ram: string | null;
  price: number; sale_price: number | null; stock: number; is_active: boolean;
};
type Sel = { color: string | null; storage: string | null; ram: string | null };
type Key = keyof Sel;
const ROWS: [Key, string][] = [["color", "Color"], ["storage", "Storage"], ["ram", "RAM"]];

export function ProductPurchase({
  product, variants,
}: {
  product: { id: string; price: number; salePrice: number | null; stock: number; lowStock: number };
  variants: Variant[];
}) {
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const active = variants.filter((v) => v.is_active);
  const first = active.find((v) => v.stock > 0) ?? active[0];

  const [sel, setSel] = useState<Sel>({ color: first?.color ?? null, storage: first?.storage ?? null, ram: first?.ram ?? null });
  const [qty, setQty] = useState(1);

  const variant = active.find((v) => v.color === sel.color && v.storage === sel.storage && v.ram === sel.ram) ?? null;
  const hasVariants = active.length > 0;

  const list = variant ? variant.price : product.price;
  const unit = variant ? (variant.sale_price ?? variant.price) : (product.salePrice ?? product.price);
  const onSale = unit < list;
  const pct = onSale ? Math.round(((list - unit) / list) * 100) : 0;
  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const label = stockLabel(stock, product.lowStock);
  const maxQty = Math.max(1, Math.min(MAX_QTY, stock));
  const q = Math.min(qty, maxQty);

  const optionsFor = (key: Key) => [...new Set(active.map((v) => v[key]).filter(Boolean))] as string[];

  const pick = (key: Key, value: string) => {
    const match = (v: Variant) => v[key] === value;
    const others = ROWS.map(([k]) => k).filter((k) => k !== key);
    const candidate =
      active.find((v) => match(v) && others.every((k) => v[k] === sel[k])) ??
      active.find((v) => match(v) && v.stock > 0) ??
      active.find(match);
    if (candidate) setSel({ color: candidate.color, storage: candidate.storage, ram: candidate.ram });
    setQty(1);
  };

  const line = { productId: product.id, variantId: variant?.id ?? null, quantity: q };
  const canBuy = stock > 0 && (!hasVariants || !!variant);
  const inWishlist = wishlist.has(product.id);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-extrabold tracking-tight">{formatPrice(unit)}</span>
        {onSale && (
          <>
            <span className="text-lg text-muted line-through">{formatPrice(list)}</span>
            <span className="rounded-full bg-sale px-2.5 py-0.5 text-sm font-bold text-white">-{pct}%</span>
          </>
        )}
      </div>
      <p className={cn("mt-2 text-sm font-semibold", label.tone)}>{label.text}</p>

      {ROWS.map(([key, title]) => {
        const opts = optionsFor(key);
        if (opts.length === 0) return null;
        return (
          <div key={key} className="mt-6">
            <p className="text-sm font-bold">{title}: <span className="font-medium text-muted">{sel[key]}</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {opts.map((o) => {
                const available = active.some((v) => v[key] === o && v.stock > 0);
                return (
                  <button
                    key={o}
                    onClick={() => pick(key, o)}
                    aria-pressed={sel[key] === o}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      sel[key] === o ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                      !available && "opacity-50 line-through"
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center rounded-full border border-line">
          <button aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center disabled:opacity-40" disabled={q <= 1} onClick={() => setQty(q - 1)}>
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-sm font-bold" aria-live="polite">{q}</span>
          <button aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center disabled:opacity-40" disabled={q >= maxQty} onClick={() => setQty(q + 1)}>
            <Plus size={16} />
          </button>
        </div>
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:border-ink"
        >
          <Heart size={20} className={inWishlist ? "fill-sale text-sale" : ""} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          disabled={!canBuy}
          onClick={() => addToCart(line)}
          className="h-12 rounded-full border border-ink text-sm font-bold transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-mist disabled:text-muted"
        >
          {canBuy ? "Add to Cart" : "Out of stock"}
        </button>
        <button
          disabled={!canBuy}
          onClick={async () => { await addToCart(line); router.push("/cart"); }}
          className="h-12 rounded-full bg-ink text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-mist disabled:text-muted"
        >
          Buy Now
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">Cash on Delivery and Bank Transfer available at checkout.</p>
    </div>
  );
}
