import type { Metadata } from "next";
import { CartView } from "@/features/cart/cart-view";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Your cart</h1>
      <CartView />
    </main>
  );
}
