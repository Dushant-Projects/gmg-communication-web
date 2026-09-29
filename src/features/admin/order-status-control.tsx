"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "refunded"];
const cls = "h-10 rounded-lg border border-line px-3 text-sm font-semibold outline-none focus:border-ink disabled:opacity-60";

export function OrderStatusControl({ orderId, status, paymentStatus }: { orderId: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const [statusVal, setStatusVal] = useState(status);
  const [paymentVal, setPaymentVal] = useState(paymentStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const update = async (field: "status" | "payment_status", value: string) => {
    const prevStatus = statusVal;
    const prevPayment = paymentVal;
    // optimistic UI so the dropdown reflects your choice immediately
    if (field === "status") setStatusVal(value); else setPaymentVal(value);
    setBusy(true);
    setError(null);
    setSaved(null);

    const { error: dbError } = await createClient().from("orders").update({ [field]: value }).eq("id", orderId);
    setBusy(false);

    if (dbError) {
      // revert the dropdown to what's actually saved, and say why
      if (field === "status") setStatusVal(prevStatus); else setPaymentVal(prevPayment);
      setError(dbError.message || "Couldn't save this change. Please try again.");
      return;
    }

    setSaved(field === "status" ? "Order status updated." : "Payment status updated.");
    router.refresh();

    if (field === "status") {
      fetch("/api/notifications/status-update", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }),
      }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-bold">Order status</span>
          <select value={statusVal} disabled={busy} onChange={(e) => update("status", e.target.value)} className={cls}>
            {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Payment status</span>
          <select value={paymentVal} disabled={busy} onChange={(e) => update("payment_status", e.target.value)} className={cls}>
            {PAYMENTS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-sale">{error}</p>}
      {saved && !error && <p role="status" className="mt-2 text-sm text-green-700">{saved}</p>}
    </div>
  );
}
