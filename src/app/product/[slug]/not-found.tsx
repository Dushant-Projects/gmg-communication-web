import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Product not found</h1>
      <p className="mt-2 text-muted">This product may have been removed or is no longer available.</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Back to shop</Link>
    </main>
  );
}
