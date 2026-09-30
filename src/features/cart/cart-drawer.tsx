"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { primaryImage } from "@/features/catalog/queries";
import { useStore } from "@/features/store/store-provider";
import { useCartDetails } from "@/features/cart/use-cart-details";

export function CartDrawer() {
  const { cartDrawerOpen, closeCartDrawer, userId, setQuantity, removeLine } = useStore();
  const { rows, subtotal, valid } = useCartDetails();

  useEffect(() => {
    if (!cartDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCartDrawer(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [cartDrawerOpen, closeCartDrawer]);

  if (!cartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Close cart" onClick={closeCartDrawer} className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm animate-[slide-in_0.25s_ease-out] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShoppingBag size={20} /> Your Cart</h2>
          <button onClick={closeCartDrawer} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist"><X size={18} /></button>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag size={36} className="text-line" />
            <p className="font-bold">Your cart is empty</p>
            <Link href="/shop" onClick={closeCartDrawer} className="mt-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white">Start Shopping</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto p-5">
              {rows.map((r) => {
                const key = { productId: r.productId, variantId: r.variantId };
                return (
                  <li key={`${r.productId}:${r.variantId}`} className="flex gap-3 border-b border-line py-4 first:pt-0 last:border-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                      {r.image && <Image src={r.image} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {r.missing ? (
                        <p className="text-sm font-bold text-sale">No longer available</p>
                      ) : (
                        <>
                          <p className="line-clamp-1 text-sm font-bold">{r.name}</p>
                          {r.label && <p className="text-xs text-muted">{r.label}</p>}
                          <p className="mt-0.5 text-sm font-semibold">{formatPrice(r.unit)}</p>
                        </>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {!r.missing ? (
                          <div className="flex items-center rounded-full border border-line">
                            <button aria-label="Decrease" className="flex h-7 w-7 items-center justify-center" onClick={() => setQuantity(key, r.quantity - 1)}><Minus size={12} /></button>
                            <span className="w-6 text-center text-xs font-bold">{r.quantity}</span>
                            <button aria-label="Increase" className="flex h-7 w-7 items-center justify-center" onClick={() => setQuantity(key, r.quantity + 1)}><Plus size={12} /></button>
                          </div>
                        ) : <span />}
                        <button aria-label="Remove" onClick={() => removeLine(key)} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-mist hover:text-sale"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-lg font-extrabold">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Shipping and discounts calculated at checkout.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/cart" onClick={closeCartDrawer} className="flex h-11 items-center justify-center rounded-full border border-ink text-sm font-bold hover:bg-ink hover:text-white">View Cart</Link>
                <Link
                  href={valid.length ? (userId ? "/checkout" : "/login?next=/checkout") : "/cart"}
                  onClick={closeCartDrawer}
                  className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-bold text-white hover:opacity-90"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
