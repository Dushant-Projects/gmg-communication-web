"use client";

import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { SHIPPING_FEE } from "@/lib/constants";
import { Stars } from "./stars";

type Review = { id: string; rating: number; comment: string | null; created_at: string };
const TABS = ["Description", "Specifications", "Reviews", "Shipping & Returns"] as const;

export function ProductTabs({
  description, specs, reviews, rating, ratingCount,
}: {
  description: string | null; specs: Record<string, string>; reviews: Review[]; rating: number; ratingCount: number;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const specRows = Object.entries(specs ?? {});

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition", tab === t ? "border-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {t}{t === "Reviews" && ratingCount > 0 ? ` (${ratingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="max-w-3xl py-6 text-sm leading-relaxed">
        {tab === "Description" && <p className="whitespace-pre-line">{description || "No description available."}</p>}

        {tab === "Specifications" &&
          (specRows.length ? (
            <dl className="divide-y divide-line rounded-2xl border border-line">
              {specRows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 px-4 py-3">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="col-span-2 text-muted">{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-muted">No specifications listed.</p>)}

        {tab === "Reviews" && (
          <div>
            <Stars rating={rating} count={ratingCount} size={18} />
            {reviews.length === 0 ? (
              <p className="mt-4 text-muted">No reviews yet. Customers can review products after their order is delivered.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line p-4">
                    <Stars rating={r.rating} count={0} />
                    {r.comment && <p className="mt-2">{r.comment}</p>}
                    <p className="mt-2 text-xs text-muted">Verified buyer · {new Date(r.created_at).toLocaleDateString("en-GB")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "Shipping & Returns" && (
          <div className="space-y-3 text-muted">
            <p>Flat shipping fee of {formatPrice(SHIPPING_FEE)} on every order. You can pay by Cash on Delivery or Bank Transfer.</p>
            <p>Track your order status anytime from your account. If something is wrong with your device, contact us as soon as you receive it and we&apos;ll help you sort it out.</p>
            <p>See our Shipping Policy and Return Policy in the footer for full details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
