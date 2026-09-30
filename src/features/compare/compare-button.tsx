"use client";

import { Scale } from "lucide-react";
import { useStore } from "@/features/store/store-provider";
import { cn } from "@/lib/utils";

export function CompareButton({ productId, className }: { productId: string; className?: string }) {
  const { compareIds, toggleCompare } = useStore();
  const active = compareIds.includes(productId);
  return (
    <button
      type="button"
      onClick={() => toggleCompare(productId)}
      aria-pressed={active}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white", active && "bg-ink text-white hover:bg-ink", className)}
    >
      <Scale size={16} className={active ? "text-white" : "text-ink"} />
    </button>
  );
}
