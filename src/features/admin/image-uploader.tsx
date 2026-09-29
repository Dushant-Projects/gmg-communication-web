"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { GripVertical, Star, Trash2, Upload } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary/upload-image";
import { cn, uid } from "@/lib/utils";

export type ImageItem = { key: string; id?: string; url: string; publicId?: string; color?: string | null };

export function ImageUploader({
  images, onChange, colors = [],
}: { images: ImageItem[]; onChange: (next: ImageItem[]) => void; colors?: string[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const next = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const { url, publicId } = await uploadImage(file, "products");
        next.push({ key: uid(), url, publicId, color: null });
      } catch (e: any) {
        setError(e?.message ?? "Some images failed to upload.");
      }
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const setColor = (i: number, color: string) => onChange(images.map((img, idx) => (idx === i ? { ...img, color: color || null } : img)));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.key} className={cn("group relative overflow-hidden rounded-xl border-2 bg-mist", i === 0 ? "border-ink" : "border-line")}>
            <div className="relative aspect-square">
              <Image src={img.url} alt="" fill sizes="150px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  <Star size={10} className="fill-white" /> Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="rounded p-1 text-white disabled:opacity-30"><GripVertical size={14} /></button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove image" className="rounded p-1 text-white hover:text-sale"><Trash2 size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right" className="rotate-180 rounded p-1 text-white disabled:opacity-30"><GripVertical size={14} /></button>
              </div>
            </div>
            {colors.length > 0 && (
              <select
                value={img.color ?? ""}
                onChange={(e) => setColor(i, e.target.value)}
                aria-label="Color this photo belongs to"
                className="w-full border-t border-line bg-white px-1.5 py-1 text-[11px] font-semibold outline-none"
              >
                <option value="">All colors</option>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs font-semibold text-muted hover:border-ink hover:text-ink">
          <Upload size={18} />
          {busy ? "Uploading…" : "Add image"}
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        First image is the primary photo. {colors.length > 0 ? "Tag each photo with a color so customers see the right pictures when they pick that color — leave \"All colors\" for shots that fit every option." : "Add variants above to tag photos by color."}
      </p>
      {error && <p role="alert" className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  );
}
