"use client";

import Link from "next/link";
import { Scale, X } from "lucide-react";
import { useStore } from "@/features/store/store-provider";

export function CompareBar() {
  const { compareIds, clearCompare, toggleCompare } = useStore();
  if (compareIds.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-line bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Scale size={18} /> Compare ({compareIds.length}/4)
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearCompare} className="rounded-full border border-line px-4 py-2 text-xs font-bold hover:border-ink">Clear</button>
          <Link
            href={compareIds.length >= 2 ? `/compare?ids=${compareIds.join(",")}` : "#"}
            aria-disabled={compareIds.length < 2}
            className={`rounded-full px-5 py-2 text-xs font-bold text-white ${compareIds.length >= 2 ? "bg-ink hover:opacity-90" : "cursor-not-allowed bg-line text-muted"}`}
          >
            {compareIds.length >= 2 ? "Compare Now" : "Add 1 more to compare"}
          </Link>
        </div>
      </div>
    </div>
  );
}
