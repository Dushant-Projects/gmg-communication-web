"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_QTY } from "@/lib/constants";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { CompareBar } from "@/features/compare/compare-bar";

export type CartLine = { productId: string; variantId: string | null; quantity: number };
type LineKey = Omit<CartLine, "quantity">;
type AddOptions = { openDrawer?: boolean };

type Ctx = {
  userId: string | null;
  userName: string | null;
  ready: boolean;
  lines: CartLine[];
  cartCount: number;
  addToCart: (line: CartLine, opts?: AddOptions) => Promise<void>;
  setQuantity: (key: LineKey, quantity: number) => Promise<void>;
  removeLine: (key: LineKey) => Promise<void>;
  resetCart: () => void;
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  notify: (message: string) => void;
  cartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
};

const StoreContext = createContext<Ctx | null>(null);
const LOCAL_KEY = "ms_cart_v1";
const COMPARE_KEY = "ms_compare_v1";
const MAX_COMPARE = 4;
const same = (a: LineKey, b: LineKey) => a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

function readLocal(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((l) => l?.productId && l?.quantity > 0) : [];
  } catch {
    return [];
  }
}
function readCompare(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const linesRef = useRef<CartLine[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = (next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
  };

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => { setCompareIds(readCompare()); }, []);

  // ---- display name for the navbar ----
  useEffect(() => {
    if (!userId) { setUserName(null); return; }
    supabase.from("profiles").select("full_name,email").eq("id", userId).single()
      .then(({ data }) => setUserName(data?.full_name || data?.email || "Account"));
  }, [userId, supabase]);

  // ---- database helpers (logged-in cart) ----
  const dbWrite = useCallback(
    async (uid: string, line: CartLine, exists: boolean) => {
      if (exists) {
        let q = supabase.from("cart_items").update({ quantity: line.quantity }).eq("user_id", uid).eq("product_id", line.productId);
        q = line.variantId ? q.eq("variant_id", line.variantId) : q.is("variant_id", null);
        await q;
      } else {
        await supabase.from("cart_items").insert({
          user_id: uid, product_id: line.productId, variant_id: line.variantId, quantity: line.quantity,
        });
      }
    },
    [supabase]
  );

  const dbDelete = useCallback(
    async (uid: string, key: LineKey) => {
      let q = supabase.from("cart_items").delete().eq("user_id", uid).eq("product_id", key.productId);
      q = key.variantId ? q.eq("variant_id", key.variantId) : q.is("variant_id", null);
      await q;
    },
    [supabase]
  );

  // ---- keep auth state in sync (server actions set cookies, so re-check on navigation) ----
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setAuthChecked(true);
    });
  }, [pathname, supabase]);

  // ---- load cart + wishlist whenever the user changes ----
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;

    (async () => {
      const local = readLocal();

      if (!userId) {
        if (cancelled) return;
        commit(local);
        setWishlist(new Set());
        setReady(true);
        return;
      }

      const [{ data: cart }, { data: wl }] = await Promise.all([
        supabase.from("cart_items").select("product_id, variant_id, quantity").eq("user_id", userId),
        supabase.from("wishlists").select("product_id").eq("user_id", userId),
      ]);

      const merged: CartLine[] = (cart ?? []).map((r: any) => ({
        productId: r.product_id, variantId: r.variant_id, quantity: r.quantity,
      }));

      for (const g of local) {
        const existing = merged.find((m) => same(m, g));
        if (existing) {
          existing.quantity = Math.min(MAX_QTY, existing.quantity + g.quantity);
          await dbWrite(userId, existing, true);
        } else {
          merged.push({ ...g, quantity: Math.min(MAX_QTY, g.quantity) });
          await dbWrite(userId, g, false);
        }
      }
      if (local.length) localStorage.removeItem(LOCAL_KEY);

      if (cancelled) return;
      commit(merged);
      setWishlist(new Set((wl ?? []).map((r: any) => r.product_id)));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, userId, supabase, dbWrite]);

  const persistLocal = (next: CartLine[]) => {
    if (!userId) localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  };

  const addToCart = useCallback(
    async (line: CartLine, opts?: AddOptions) => {
      const cur = linesRef.current;
      const existing = cur.find((x) => same(x, line));
      const quantity = Math.min(MAX_QTY, (existing?.quantity ?? 0) + line.quantity);
      const next = existing
        ? cur.map((x) => (same(x, line) ? { ...x, quantity } : x))
        : [...cur, { ...line, quantity }];
      commit(next);
      persistLocal(next);
      notify("Added to cart");
      if (opts?.openDrawer !== false) setCartDrawerOpen(true);
      if (userId) await dbWrite(userId, { ...line, quantity }, !!existing);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, dbWrite, notify]
  );

  const removeLine = useCallback(
    async (key: LineKey) => {
      const next = linesRef.current.filter((x) => !same(x, key));
      commit(next);
      persistLocal(next);
      if (userId) await dbDelete(userId, key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, dbDelete]
  );

  const setQuantity = useCallback(
    async (key: LineKey, quantity: number) => {
      if (quantity < 1) return removeLine(key);
      const q = Math.min(MAX_QTY, quantity);
      const next = linesRef.current.map((x) => (same(x, key) ? { ...x, quantity: q } : x));
      commit(next);
      persistLocal(next);
      if (userId) await dbWrite(userId, { ...key, quantity: q }, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, dbWrite, removeLine]
  );

  const resetCart = useCallback(() => {
    commit([]);
    localStorage.removeItem(LOCAL_KEY);
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const has = wishlist.has(productId);
      const next = new Set(wishlist);
      if (has) next.delete(productId);
      else next.add(productId);
      setWishlist(next);
      notify(has ? "Removed from wishlist" : "Saved to wishlist");
      if (has) await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
      else await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
      router.refresh();
    },
    [userId, wishlist, supabase, router, pathname, notify]
  );

  const toggleCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      const has = prev.includes(productId);
      const next = has ? prev.filter((id) => id !== productId) : [...prev, productId].slice(0, MAX_COMPARE);
      if (!has && prev.length >= MAX_COMPARE) { notify(`You can compare up to ${MAX_COMPARE} products`); return prev; }
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, [notify]);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    localStorage.removeItem(COMPARE_KEY);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      userId, userName, ready, lines,
      cartCount: lines.reduce((s, l) => s + l.quantity, 0),
      addToCart, setQuantity, removeLine, resetCart, wishlist, toggleWishlist, notify,
      cartDrawerOpen, openCartDrawer: () => setCartDrawerOpen(true), closeCartDrawer: () => setCartDrawerOpen(false),
      compareIds, toggleCompare, clearCompare,
    }),
    [userId, userName, ready, lines, addToCart, setQuantity, removeLine, resetCart, wishlist, toggleWishlist, notify, cartDrawerOpen, compareIds, toggleCompare, clearCompare]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <CartDrawer />
      <CompareBar />
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
