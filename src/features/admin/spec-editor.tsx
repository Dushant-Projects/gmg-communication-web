"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpecRow = { key: string; value: string };

export function SpecEditor({ rows, onChange }: { rows: SpecRow[]; onChange: (next: SpecRow[]) => void }) {
  const update = (i: number, field: keyof SpecRow, v: string) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { key: "", value: "" }]);
  const cls = "h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-ink";

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input value={r.key} onChange={(e) => update(i, "key", e.target.value)} placeholder="e.g. Display" className={cn(cls, "w-1/3")} />
          <input value={r.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="e.g. 6.7-inch OLED, 120Hz" className={cn(cls, "flex-1")} />
          <button type="button" onClick={() => remove(i)} aria-label="Remove spec" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-sale"><Trash2 size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="rounded-full border border-line px-4 py-2 text-xs font-bold hover:border-ink">+ Add specification</button>
    </div>
  );
}
