"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Pause, Play, Plus } from "lucide-react";
import { MAX_QTY } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/features/store/store-provider";
import { stockLabel } from "@/features/catalog/queries";
import { Stars } from "./stars";

export type Variant = {
  id: string; color: string | null; storage: string | null; ram: string | null;
  price: number; sale_price: number | null; stock: number; is_active: boolean;
};
export type GalleryImage = { url: string; color: string | null };
type Sel = { color: string | null; storage: string | null; ram: string | null };
type Key = keyof Sel;
const ROWS: [Key, string][] = [["color", "Color"], ["storage", "Storage"], ["ram", "RAM"]];
const AUTOPLAY_MS = 3500;

export function ProductInteractive({
  product, variants, images, videoUrl, brandName, brandSlug, name, model, rating, ratingCount,
}: {
  product: { id: string; price: number; salePrice: number | null; stock: number; lowStock: number };
  variants: Variant[]; images: GalleryImage[]; videoUrl: string | null;
  brandName: string | null; brandSlug: string | null; name: string; model: string | null;
  rating: number; ratingCount: number;
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

  // ---- gallery: filter photos by the selected color, video always last ----
  const shown = useMemo(() => {
    if (sel.color) {
      const tagged = images.filter((i) => i.color === sel.color);
      if (tagged.length) return tagged;
    }
    const generic = images.filter((i) => !i.color);
    return generic.length ? generic : images;
  }, [images, sel.color]);

  const [index, setIndex] = useState(0);
  const [showingVideo, setShowingVideo] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [origin, setOrigin] = useState("50% 50%");

  useEffect(() => { setIndex(0); setShowingVideo(false); }, [sel.color]);

  useEffect(() => {
    if (!autoplay || hovering || showingVideo || shown.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % shown.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [autoplay, hovering, showingVideo, shown.length]);

  const current = shown[index];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div
          className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-mist"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
        >
          {showingVideo && videoUrl ? (
            <video src={videoUrl} controls autoPlay className="h-full w-full object-contain bg-black" />
          ) : (
            current && (
              <Image
                key={current.url} src={current.url} alt={name} fill priority sizes="(min-width:1024px) 50vw, 100vw"
                style={{ transformOrigin: origin }}
                className={cn("object-cover transition-transform duration-200", hovering && "scale-150")}
              />
            )
          )}
          {!showingVideo && shown.length > 1 && (
            <button
              type="button" onClick={() => setAutoplay((v) => !v)} aria-label={autoplay ? "Pause slideshow" : "Play slideshow"}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
            >
              {autoplay ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
        </div>

        {(shown.length > 1 || videoUrl) && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {shown.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => { setIndex(i); setShowingVideo(false); }}
                aria-label={`Show image ${i + 1}`}
                className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-mist", !showingVideo && i === index ? "border-ink" : "border-transparent")}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
            {videoUrl && (
              <button
                onClick={() => setShowingVideo(true)}
                aria-label="Play video"
                className={cn("relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-ink text-white", showingVideo ? "border-ink" : "border-transparent")}
              >
                <Play size={20} className="fill-white" />
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        {brandName && <Link href={`/shop?brand=${brandSlug}`} className="text-sm font-bold text-accent hover:underline">{brandName}</Link>}
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
        {model && <p className="mt-1 text-sm text-muted">Model: {model}</p>}
        <div className="mt-3"><Stars rating={rating} count={ratingCount} size={16} /></div>

        <div className="mt-6 flex flex-wrap items-baseline gap-3">
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
        <p className="mt-3 text-xs text-muted">Cash on Delivery, Bank Transfer, EasyPaisa and JazzCash available at checkout.</p>
      </div>
    </div>
  );
}
