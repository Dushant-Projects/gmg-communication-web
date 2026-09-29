import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Order not found</h1>
      <p className="mt-2 text-muted">We couldn&apos;t find this order in your account.</p>
      <Link href="/account/orders" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">My orders</Link>
    </main>
  );
}
