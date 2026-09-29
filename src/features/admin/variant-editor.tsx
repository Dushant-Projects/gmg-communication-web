"use client";

import { Trash2 } from "lucide-react";
import { uid } from "@/lib/utils";

export type VariantRow = { key: string; id?: string; color: string; storage: string; ram: string; price: string; sale_price: string; stock: string; is_active: boolean };

export const emptyVariant = (): VariantRow => ({ key: uid(), color: "", storage: "", ram: "", price: "", sale_price: "", stock: "0", is_active: true });

export function VariantEditor({ rows, onChange }: { rows: VariantRow[]; onChange: (next: VariantRow[]) => void }) {
  const update = (i: number, field: keyof VariantRow, v: string | boolean) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, emptyVariant()]);
  const cls = "h-10 w-full rounded-lg border border-line px-2 text-sm outline-none focus:border-ink";

  return (
    <div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 sm:grid-cols-7 sm:items-center">
            <input value={r.color} onChange={(e) => update(i, "color", e.target.value)} placeholder="Color" className={cls} />
            <input value={r.storage} onChange={(e) => update(i, "storage", e.target.value)} placeholder="Storage" className={cls} />
            <input value={r.ram} onChange={(e) => update(i, "ram", e.target.value)} placeholder="RAM" className={cls} />
            <input value={r.price} onChange={(e) => update(i, "price", e.target.value)} type="number" min={0} placeholder="Price" required className={cls} />
            <input value={r.sale_price} onChange={(e) => update(i, "sale_price", e.target.value)} type="number" min={0} placeholder="Sale price" className={cls} />
            <input value={r.stock} onChange={(e) => update(i, "stock", e.target.value)} type="number" min={0} placeholder="Stock" required className={cls} />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" checked={r.is_active} onChange={(e) => update(i, "is_active", e.target.checked)} className="h-4 w-4 accent-ink" /> Active</label>
              <button type="button" onClick={() => remove(i)} aria-label="Remove variant" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-sale"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 rounded-full border border-line px-4 py-2 text-xs font-bold hover:border-ink">+ Add variant</button>
      {rows.length > 0 && <p className="mt-2 text-xs text-muted">Total stock is the sum of all variant stock and is managed automatically.</p>}
    </div>
  );
}
