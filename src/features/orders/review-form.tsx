"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ReviewForm({ userId, orderId, productId }: { userId: string; orderId: string; productId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { setMsg({ ok: false, text: "Choose a star rating." }); return; }
    setBusy(true);
    const { error } = await createClient().from("reviews").insert({
      user_id: userId, order_id: orderId, product_id: productId, rating, comment: comment.trim() || null, status: "pending",
    });
    setBusy(false);
    if (!error) setMsg({ ok: true, text: "Thanks! Your review will appear once it is approved." });
    else if (error.code === "23505") setMsg({ ok: true, text: "You've already reviewed this item." });
    else setMsg({ ok: false, text: "We couldn't submit your review. Please try again." });
  };

  if (msg?.ok) return <p className="mt-2 text-sm font-semibold text-green-700">{msg.text}</p>;

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
            <Star size={24} className={cn(n <= rating ? "fill-amber-400 text-amber-400" : "text-line")} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={1000} placeholder="Share your experience (optional)" className="w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink" />
      {msg && <p role="alert" className="text-sm text-sale">{msg.text}</p>}
      <button disabled={busy} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Submitting…" : "Submit review"}</button>
    </form>
  );
}
