"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadPaymentProof } from "@/lib/cloudinary/upload-image";
import { friendlyProofError } from "@/lib/constants";

export function PaymentProofUpload({
  orderId, existingUrl, existingReference,
}: { orderId: string; existingUrl: string | null; existingReference: string | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [reference, setReference] = useState(existingReference ?? "");
  const [preview, setPreview] = useState(existingUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submitProof = async (proofUrl: string | null, ref: string | null) => {
    const { error: rpcErr } = await supabase.rpc("submit_payment_proof", { p_order_id: orderId, p_proof_url: proofUrl, p_reference: ref });
    if (rpcErr) throw new Error(rpcErr.message);
  };

  const handleFile = async (file: File) => {
    setBusy(true); setError(null);
    try {
      const { url } = await uploadPaymentProof(file, orderId);
      setPreview(url);
      await submitProof(url, reference || null);
      setDone(true);
      router.refresh();
    } catch (e: any) {
      setError(friendlyProofError(e?.message));
    }
    setBusy(false);
  };

  const submitReferenceOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() && !preview) { setError("Enter your transaction reference or upload a screenshot."); return; }
    setBusy(true); setError(null);
    try {
      await submitProof(null, reference);
      setDone(true);
      router.refresh();
    } catch (e: any) {
      setError(friendlyProofError(e?.message));
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="font-extrabold">Upload payment proof</p>
      <p className="mt-1 text-sm text-muted">Take a screenshot of your payment and upload it, or enter your transaction reference. We&apos;ll confirm it shortly.</p>

      {preview && (
        <div className="relative mt-3 h-28 w-28 overflow-hidden rounded-xl border border-line">
          <Image src={preview} alt="Payment screenshot" fill sizes="112px" className="object-cover" />
        </div>
      )}

      <label className="mt-3 flex h-11 w-fit cursor-pointer items-center gap-2 rounded-full border border-ink px-5 text-sm font-bold hover:bg-ink hover:text-white">
        <Upload size={16} /> {busy ? "Uploading…" : preview ? "Replace screenshot" : "Upload screenshot"}
        <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      <form onSubmit={submitReferenceOnly} className="mt-3 flex flex-wrap gap-2">
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID / reference (optional)" className="h-10 min-w-[220px] flex-1 rounded-full border border-line px-4 text-sm outline-none focus:border-ink" />
        <button disabled={busy} className="h-10 rounded-full border border-line px-5 text-sm font-bold hover:border-ink">Save reference</button>
      </form>

      {error && <p role="alert" className="mt-2 text-sm text-sale">{error}</p>}
      {done && <p className="mt-2 text-sm font-semibold text-green-700">Submitted. We&apos;ll confirm your payment shortly.</p>}
    </div>
  );
}
