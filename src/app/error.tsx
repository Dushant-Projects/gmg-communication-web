"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">We couldn&apos;t load this page. Please try again.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white">Try again</button>
    </main>
  );
}
