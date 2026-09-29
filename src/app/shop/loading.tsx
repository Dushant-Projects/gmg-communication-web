export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-9 w-40 animate-pulse rounded-lg bg-mist" />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line p-3">
            <div className="aspect-square animate-pulse rounded-xl bg-mist" />
            <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-mist" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-mist" />
            <div className="mt-3 h-11 animate-pulse rounded-full bg-mist" />
          </div>
        ))}
      </div>
    </main>
  );
}
