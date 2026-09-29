import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Go home</Link>
    </main>
  );
}
