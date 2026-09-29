"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_FEE } from "@/lib/constants";
import { primaryImage } from "@/features/catalog/queries";
import { useStore } from "@/features/store/store-provider";

/** Loads product/variant details for the current cart lines and computes totals (display only; the server recalculates). */
export function useCartDetails() {
  const { lines, ready } = useStore();
  const [products, setProducts] = useState<Record<string, any>>({});
  const [variants, setVariants] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

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
    return {
      ...l, name: p?.name as string | undefined, image: p ? primaryImage(p.product_images) : null,
      label: v ? [v.color, v.storage, v.ram].filter(Boolean).join(" / ") : null,
      missing, stock, unit, lineTotal: unit * l.quantity, over: !missing && l.quantity > stock,
    };
  });
  const valid = rows.filter((r) => !r.missing);
  const subtotal = valid.reduce((s, r) => s + r.lineTotal, 0);
  const shipping = valid.length ? SHIPPING_FEE : 0;
  const blocked = rows.some((r) => r.missing || r.over || r.stock <= 0);

  return { ready: ready && loaded, lines, rows, valid, subtotal, shipping, blocked };
}
