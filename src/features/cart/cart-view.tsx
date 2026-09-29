"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COUPON_MESSAGES, MAX_QTY, SHIPPING_FEE } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { primaryImage } from "@/features/catalog/queries";
import { useStore } from "@/features/store/store-provider";

export function CartView() {
  const { lines, ready, userId, setQuantity, removeLine } = useStore();
  const [products, setProducts] = useState<Record<string, any>>({});
  const [variants, setVariants] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  // reload product details only when the SET of items changes (not on quantity changes)
  const idsKey = lines.map((l) => `${l.productId}:${l.variantId}`).join(",");
  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) { setLoaded(true); return; }
    const supabase = createClient();
    const pids = [...new Set(lines.map((l) => l.productId))];
    const vids = [...new Set(lines.map((l) => l.variantId).filter(Boolean))] as string[];
    (async () => {
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from("products").select("id,name,slug,price,sale_price,stock,product_images(url,is_primary,sort_order)").in("id", pids).eq("is_active", true),
        vids.length
          ? supabase.from("product_variants").select("id,color,storage,ram,price,sale_price,stock").in("id", vids).eq("is_active", true)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setProducts(Object.fromEntries((p ?? []).map((x: any) => [x.id, x])));
      setVariants(Object.fromEntries((v ?? []).map((x: any) => [x.id, x])));
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey]);

  const rows = lines.map((l) => {
    const p = products[l.productId];
    const v = l.variantId ? variants[l.variantId] : null;
    const missing = !p || (!!l.variantId && !v);
    const stock = v ? v.stock : (p?.stock ?? 0);
    const unit = v ? Number(v.sale_price ?? v.price) : p ? Number(p.sale_price ?? p.price) : 0;
    return { ...l, p, v, missing, stock, unit, lineTotal: unit * l.quantity, over: !missing && l.quantity > stock };
  });
  const valid = rows.filter((r) => !r.missing);
  const subtotal = valid.reduce((s, r) => s + r.lineTotal, 0);
  const discount = applied ? Math.min(applied.discount, subtotal) : 0;
  const shipping = valid.length ? SHIPPING_FEE : 0;
  const total = subtotal - discount + shipping;
  const blocked = rows.some((r) => r.missing || r.over || r.stock <= 0);

  // a coupon amount depends on the subtotal: ask the user to re-apply when it changes
  useEffect(() => {
    if (applied) { setApplied(null); localStorage.removeItem("ms_coupon"); setCouponMsg("Cart updated. Apply your coupon again."); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const applyCoupon = async () => {
    if (!userId) { setCouponMsg("Log in to apply a coupon."); return; }
    if (!code.trim()) return;
    const { data } = await createClient().rpc("preview_coupon", { p_code: code.trim(), p_subtotal: subtotal });
    if (data?.valid) {
      const c = code.trim().toUpperCase();
      setApplied({ code: c, discount: Number(data.discount) });
      localStorage.setItem("ms_coupon", c);
      setCouponMsg(null);
    } else {
      setCouponMsg(COUPON_MESSAGES[data?.code] ?? "This coupon can't be applied.");
    }
  };

  if (!ready || !loaded) {
    return <div className="mt-8 h-64 animate-pulse rounded-2xl bg-mist" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line py-20 text-center">
        <p className="text-xl font-extrabold">Your cart is empty.</p>
        <p className="mt-1 text-sm text-muted">Discover our latest smartphones.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">
        {rows.map((r) => {
          const key = { productId: r.productId, variantId: r.variantId };
          const img = r.p ? primaryImage(r.p.product_images) : null;
          const label = r.v ? [r.v.color, r.v.storage, r.v.ram].filter(Boolean).join(" / ") : null;
          const maxQ = Math.min(MAX_QTY, r.stock);
          return (
            <li key={`${r.productId}:${r.variantId}`} className="flex gap-4 rounded-2xl border border-line p-3 sm:p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-mist sm:h-28 sm:w-28">
                {img && <Image src={img} alt="" fill sizes="112px" className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {r.missing ? (
                  <p className="font-bold text-sale">This item is no longer available.</p>
                ) : (
                  <>
                    <Link href={`/product/${r.p.slug}`} className="line-clamp-2 font-bold hover:underline">{r.p.name}</Link>
                    {label && <p className="mt-0.5 text-xs text-muted">{label}</p>}
                    <p className="mt-1 text-sm font-bold">{formatPrice(r.unit)}</p>
                    {r.over && <p className="mt-1 text-xs font-semibold text-sale">{r.stock > 0 ? `Only ${r.stock} available. Reduce the quantity.` : "Out of stock. Remove this item."}</p>}
                  </>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  {!r.missing ? (
                    <div className="flex items-center rounded-full border border-line">
                      <button aria-label="Decrease quantity" className="flex h-9 w-9 items-center justify-center" onClick={() => setQuantity(key, r.quantity - 1)}><Minus size={14} /></button>
                      <span className="w-7 text-center text-sm font-bold">{r.quantity}</span>
                      <button aria-label="Increase quantity" className="flex h-9 w-9 items-center justify-center disabled:opacity-40" disabled={r.quantity >= maxQ} onClick={() => setQuantity(key, r.quantity + 1)}><Plus size={14} /></button>
                    </div>
                  ) : <span />}
                  <div className="flex items-center gap-3">
                    {!r.missing && <span className="font-extrabold">{formatPrice(r.lineTotal)}</span>}
                    <button aria-label="Remove item" onClick={() => removeLine(key)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-mist hover:text-sale"><Trash2 size={17} /></button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-line p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold">Order summary</h2>

        <div className="mt-4 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-sm uppercase outline-none focus:border-ink" />
          <button onClick={applyCoupon} className="h-11 rounded-full border border-ink px-5 text-sm font-bold hover:bg-ink hover:text-white">Apply</button>
        </div>
        {couponMsg && <p role="alert" className="mt-2 text-xs text-sale">{couponMsg}</p>}
        {applied && <p className="mt-2 text-xs font-semibold text-green-700">Coupon {applied.code} applied.</p>}

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="font-semibold">{discount ? `- ${formatPrice(discount)}` : formatPrice(0)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold">{formatPrice(shipping)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatPrice(total)}</dd></div>
        </dl>

        {blocked ? (
          <p className="mt-5 rounded-xl bg-mist p-3 text-xs text-muted">Fix the items marked above to continue to checkout.</p>
        ) : (
          <Link
            href={userId ? "/checkout" : "/login?next=/checkout"}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-ink text-sm font-bold text-white hover:opacity-90"
          >
            Proceed to Checkout
          </Link>
        )}
        <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-muted hover:text-ink">Continue shopping</Link>
      </aside>
    </div>
  );
}
