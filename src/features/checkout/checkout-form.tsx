"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUPON_MESSAGES, friendlyOrderError } from "@/lib/constants";
import { PaymentInstructions, type PaymentSetting } from "@/features/orders/payment-instructions";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/features/store/store-provider";
import { useCartDetails } from "@/features/cart/use-cart-details";

export type SavedAddress = {
  id: string; full_name: string; phone: string; address: string; city: string; area: string | null; postal_code: string | null;
};
type Props = { userId: string; profile: { full_name: string; email: string; phone: string }; addresses: SavedAddress[]; paymentSettings: PaymentSetting[] };

const input = "h-12 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10";

export function CheckoutForm({ userId, profile, addresses, paymentSettings }: Props) {
  const router = useRouter();
  const { resetCart } = useStore();
  const { ready, rows, valid, subtotal, shipping, blocked, lines } = useCartDetails();

  const start = addresses[0];
  const [addressId, setAddressId] = useState<string>(start?.id ?? "new");
  const [f, setF] = useState({
    full_name: start?.full_name ?? profile.full_name, phone: start?.phone ?? profile.phone, email: profile.email,
    address: start?.address ?? "", city: start?.city ?? "", area: start?.area ?? "", postal_code: start?.postal_code ?? "",
  });
  const [payment, setPayment] = useState<string>("cod");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const chooseAddress = (id: string) => {
    setAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (a) setF((s) => ({ ...s, full_name: a.full_name, phone: a.phone, address: a.address, city: a.city, area: a.area ?? "", postal_code: a.postal_code ?? "" }));
    else setF((s) => ({ ...s, address: "", city: "", area: "", postal_code: "" }));
  };

  // re-validate a coupon chosen in the cart (server decides the real discount)
  useEffect(() => {
    if (!ready || subtotal <= 0) return;
    const code = localStorage.getItem("ms_coupon");
    if (!code) { setCoupon(null); return; }
    supabase.rpc("preview_coupon", { p_code: code, p_subtotal: subtotal }).then(({ data }) => {
      if (data?.valid) setCoupon({ code, discount: Number(data.discount) });
      else { localStorage.removeItem("ms_coupon"); setCoupon(null); setError(COUPON_MESSAGES[data?.code] ?? null); }
    });
  }, [ready, subtotal, supabase]);

  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal - discount + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || done || blocked || valid.length === 0) return; // prevents duplicate submissions
    setError(null);
    setBusy(true);

    const { data, error: rpcError } = await supabase.rpc("place_order", {
      p_items: lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
      p_full_name: f.full_name, p_phone: f.phone, p_email: f.email,
      p_address: f.address, p_city: f.city, p_area: f.area, p_postal_code: f.postal_code,
      p_payment_method: payment, p_coupon_code: coupon?.code ?? null, p_notes: notes || null,
    });

    const order = Array.isArray(data) ? data[0] : null;
    if (rpcError || !order) {
      setBusy(false);
      const msg = rpcError?.message ?? "";
      if (/COUPON/.test(msg)) { localStorage.removeItem("ms_coupon"); setCoupon(null); }
      setError(friendlyOrderError(msg));
      return;
    }

    if (saveAddress && addressId === "new") {
      await supabase.from("addresses").insert({
        user_id: userId, full_name: f.full_name, phone: f.phone, address: f.address, city: f.city,
        area: f.area || null, postal_code: f.postal_code || null, is_default: addresses.length === 0,
      });
    }
    localStorage.removeItem("ms_coupon");
    setDone(true);
    resetCart();

    // Best-effort confirmation email — never blocks the redirect if it fails or isn't configured.
    fetch("/api/notifications/order-confirmation", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.out_order_id }),
    }).catch(() => {});

    router.push(`/orders/${order.out_order_id}?placed=1`);
  };

  if (!ready) return <div className="mt-8 h-72 animate-pulse rounded-2xl bg-mist" />;
  if (done) return <p className="mt-10 text-center font-semibold">Order placed. Taking you to your order…</p>;
  if (lines.length === 0)
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line py-20 text-center">
        <p className="text-xl font-extrabold">Your cart is empty.</p>
        <p className="mt-1 text-sm text-muted">Discover our latest smartphones.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Start Shopping</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-extrabold">Customer information</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required value={f.full_name} onChange={set("full_name")} placeholder="Full name" autoComplete="name" className={cn(input, "sm:col-span-2")} />
            <input required value={f.phone} onChange={set("phone")} placeholder="Phone (e.g. 0300 1234567)" autoComplete="tel" inputMode="tel" minLength={7} className={input} />
            <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" autoComplete="email" className={input} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Delivery information</h2>
          {addresses.length > 0 && (
            <select value={addressId} onChange={(e) => chooseAddress(e.target.value)} aria-label="Saved addresses" className={cn(input, "mt-3")}>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.full_name}: {a.address}, {a.city}</option>)}
              <option value="new">Use a new address</option>
            </select>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required value={f.address} onChange={set("address")} placeholder="Street address" autoComplete="street-address" className={cn(input, "sm:col-span-2")} />
            <input required value={f.city} onChange={set("city")} placeholder="City" autoComplete="address-level2" className={input} />
            <input value={f.area} onChange={set("area")} placeholder="Area" className={input} />
            <input value={f.postal_code} onChange={set("postal_code")} placeholder="Postal code" autoComplete="postal-code" className={input} />
          </div>
          {addressId === "new" && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-ink" />
              Save this address to my account
            </label>
          )}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes (optional)" rows={2} className="mt-3 w-full rounded-xl border border-line p-4 text-sm outline-none focus:border-ink" />
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Payment method</h2>
          <div className="mt-3 space-y-3">
            <label className={cn("flex cursor-pointer gap-3 rounded-2xl border p-4", payment === "cod" ? "border-ink" : "border-line")}>
              <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="mt-1 h-4 w-4 accent-ink" />
              <span><span className="block font-bold">Cash on Delivery</span><span className="text-sm text-muted">Pay in cash when your order arrives.</span></span>
            </label>
            {paymentSettings.map((s) => (
              <label key={s.method} className={cn("flex cursor-pointer gap-3 rounded-2xl border p-4", payment === s.method ? "border-ink" : "border-line")}>
                <input type="radio" name="payment" checked={payment === s.method} onChange={() => setPayment(s.method)} className="mt-1 h-4 w-4 accent-ink" />
                <span><span className="block font-bold">{s.display_name}</span><span className="text-sm text-muted">Pay now, then upload your screenshot on the next page.</span></span>
              </label>
            ))}
            {payment !== "cod" && paymentSettings.find((s) => s.method === payment) && (
              <PaymentInstructions setting={paymentSettings.find((s) => s.method === payment)!} />
            )}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-line p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={`${r.productId}:${r.variantId}`} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                {r.image && <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{r.missing ? "Unavailable item" : r.name}</p>
                <p className="text-xs text-muted">{[r.label, `Qty ${r.quantity}`].filter(Boolean).join(" · ")}</p>
                {(r.missing || r.over) && <p className="text-xs font-semibold text-sale">Fix this in your cart.</p>}
              </div>
              {!r.missing && <span className="font-semibold">{formatPrice(r.lineTotal)}</span>}
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount{coupon ? ` (${coupon.code})` : ""}</dt><dd className="font-semibold">{discount ? `- ${formatPrice(discount)}` : formatPrice(0)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold">{formatPrice(shipping)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatPrice(total)}</dd></div>
        </dl>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-sale">{error}</p>}

        {blocked ? (
          <Link href="/cart" className="mt-5 flex h-12 items-center justify-center rounded-full border border-ink text-sm font-bold">Review your cart</Link>
        ) : (
          <button disabled={busy} className="mt-5 h-12 w-full rounded-full bg-ink text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
            {busy ? "Placing order…" : "Place Order"}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-muted">Final prices are confirmed by our server when you place the order.</p>
      </aside>
    </form>
  );
}
