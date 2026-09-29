"use client";

import { useRef, useState } from "react";
import { Trash2, Video } from "lucide-react";
import { uploadVideo } from "@/lib/cloudinary/upload-image";

export function VideoUploader({ url, onChange }: { url: string | null; onChange: (url: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Please choose a video file."); return; }
    setBusy(true);
    setError(null);
    try {
      const { url: uploaded } = await uploadVideo(file, "products");
      onChange(uploaded);
    } catch (e: any) {
      setError(e?.message ?? "Video upload failed.");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {url ? (
        <div className="flex items-start gap-3">
          <video src={url} controls className="h-32 w-52 rounded-xl border border-line bg-black object-contain" />
          <button type="button" onClick={() => onChange(null)} aria-label="Remove video" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-mist hover:text-sale">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label className="flex h-24 w-52 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs font-semibold text-muted hover:border-ink hover:text-ink">
          <Video size={18} />
          {busy ? "Uploading…" : "Upload video"}
          <input ref={inputRef} type="file" accept="video/*" className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
        </label>
      )}
      <p className="mt-2 text-xs text-muted">Optional unboxing / demo video shown on the product page.</p>
      {error && <p role="alert" className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  );
}
