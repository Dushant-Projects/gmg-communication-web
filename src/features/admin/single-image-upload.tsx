"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { uploadImage, type CloudinaryFolder } from "@/lib/cloudinary/upload-image";

export function SingleImageUpload({
  url, onChange, folder,
}: { url: string | null; onChange: (url: string | null) => void; folder: CloudinaryFolder }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url: uploaded } = await uploadImage(file, folder);
      onChange(uploaded);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed.");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
          {url ? <Image src={url} alt="" fill sizes="64px" className="object-contain" /> : <Upload size={18} className="text-muted" />}
        </div>
        <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-xs font-bold hover:border-ink">
          {busy ? "Uploading…" : url ? "Replace image" : "Upload image"}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
        </label>
        {url && (
          <button type="button" onClick={() => onChange(null)} aria-label="Remove image" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-mist hover:text-sale">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  );
}
