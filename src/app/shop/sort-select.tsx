"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["featured", "Featured"], ["newest", "Newest"], ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"], ["rating", "Highest Rated"], ["discount", "Biggest Discount"],
];

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      aria-label="Sort by" value={value}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        p.set("sort", e.target.value);
        p.delete("page");
        router.push(`/shop?${p.toString()}`);
      }}
      className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold"
    >
      {OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
