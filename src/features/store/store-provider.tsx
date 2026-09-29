"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_QTY } from "@/lib/constants";

export type CartLine = { productId: string; variantId: string | null; quantity: number };
type LineKey = Omit<CartLine, "quantity">;

type Ctx = {
  userId: string | null;
  userName: string | null;
  ready: boolean;
  lines: CartLine[];
  cartCount: number;
  addToCart: (line: CartLine) => Promise<void>;
  setQuantity: (key: LineKey, quantity: number) => Promise<void>;
  removeLine: (key: LineKey) => Promise<void>;
  resetCart: () => void;
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  notify: (message: string) => void;
};

const StoreContext = createContext<Ctx | null>(null);
const LOCAL_KEY = "ms_cart_v1";
const same = (a: LineKey, b: LineKey) => a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

function readLocal(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((l) => l?.productId && l?.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({
  children,
  initialUserId = null,
  initialUserName = null,
}: {
  children: React.ReactNode;
  initialUserId?: string | null;
  initialUserName?: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  // Server se aaya hua initial state — first paint pe hi correct login state
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [userName, setUserName] = useState<string | null>(initialUserName);
  const [authChecked, setAuthChecked] = useState(true); // server already checked
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
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

  // ---- keep auth state in sync ----
  // Server already gave us initialUserId. Client listener handles login/logout after that.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore INITIAL_SESSION if we already have server value (avoids flash)
      if (event === "INITIAL_SESSION" && initialUserId !== undefined) return;
      setUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, initialUserId]);

  // Re-check on navigation (covers server-action redirects + soft navigations)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      setAuthChecked(true);
    });
  }, [pathname, supabase]);

  // Sync when server re-renders layout with new initial props (e.g. after login redirect)
  useEffect(() => {
    setUserId(initialUserId);
    if (initialUserName) setUserName(initialUserName);
  }, [initialUserId, initialUserName]);

  // ---- display name for the navbar ----
  useEffect(() => {
    if (!userId) {
      setUserName(null);
      return;
    }
    // Agar server se pehle se name aa gaya hai to dobara fetch mat karo
    if (initialUserName && initialUserId === userId) {
      setUserName(initialUserName);
      return;
    }
    supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setUserName(data?.full_name || data?.email || "Account"));
  }, [userId, supabase, initialUserId, initialUserName]);

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

      // merge the guest cart into the account cart
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
    async (line: CartLine) => {
      const cur = linesRef.current;
      const existing = cur.find((x) => same(x, line));
      const quantity = Math.min(MAX_QTY, (existing?.quantity ?? 0) + line.quantity);
      const next = existing
        ? cur.map((x) => (same(x, line) ? { ...x, quantity } : x))
        : [...cur, { ...line, quantity }];
      commit(next);
      persistLocal(next);
      notify("Added to cart");
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
      router.refresh(); // keeps /wishlist in sync
    },
    [userId, wishlist, supabase, router, pathname, notify]
  );

  const value = useMemo<Ctx>(
    () => ({
      userId, userName, ready, lines,
      cartCount: lines.reduce((s, l) => s + l.quantity, 0),
      addToCart, setQuantity, removeLine, resetCart, wishlist, toggleWishlist, notify,
    }),
    [userId, userName, ready, lines, addToCart, setQuantity, removeLine, resetCart, wishlist, toggleWishlist, notify]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">
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