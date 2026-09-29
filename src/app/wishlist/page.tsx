import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { one, PRODUCT_CARD_SELECT, toCard } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");

  const { data } = await supabase
    .from("wishlists")
    .select(`created_at, products!inner(${PRODUCT_CARD_SELECT})`)
    .eq("user_id", user.id)
    .eq("products.is_active", true)
    .order("created_at", { ascending: false });

  const items = (data ?? []).map((r: any) => one<any>(r.products)).filter(Boolean).map(toCard);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Your wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line py-20 text-center">
          <p className="text-xl font-extrabold">Your wishlist is empty.</p>
          <p className="mt-1 text-sm text-muted">Save products you love for later.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Start Shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
