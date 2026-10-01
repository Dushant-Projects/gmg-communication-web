"use client";

import { useEffect, useState } from "react";
import { Clock, Eye } from "lucide-react";

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Real inventory only: low stock means 0 < stock <= threshold (same rule as stockLabel; default 5). */
export function lowStockThreshold(lowStock: number | null | undefined) {
  return typeof lowStock === "number" && Number.isFinite(lowStock) && lowStock >= 0
    ? lowStock
    : 5;
}

export function isLowStock(stock: number, lowStock: number | null | undefined) {
  return Number.isFinite(stock) && stock > 0 && stock <= lowStockThreshold(lowStock);
}

/* ------------------------------------------------------------------ */
/* 1. Sale countdown                                                  */
/*    - endsAt set + in the future -> real countdown to that date     */
/*    - endsAt set + in the past   -> sale ended, timer is hidden     */
/*    - endsAt empty               -> auto-restarting 3-hour countdown */
/* ------------------------------------------------------------------ */

const CYCLE_MS = 3 * 60 * 60 * 1000; // evergreen fallback period = 3 hours

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg bg-ink px-2 text-base font-extrabold tabular-nums text-white sm:h-10 sm:min-w-[2.75rem] sm:text-lg">
        {value}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
    </div>
  );
}

const Colon = () => (
  <span className="pt-1.5 text-lg font-extrabold text-accent">:</span>
);

export function SaleCountdown({
  productId,
  endsAt = null,
}: {
  productId: string;
  /** ISO date from products.sale_ends_at. Null/invalid = evergreen restarting timer. */
  endsAt?: string | null;
}) {
  // null until mounted so server and client markup match (no hydration warning)
  const [secs, setSecs] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const endMs = endsAt ? new Date(endsAt).getTime() : NaN;
    const real = Number.isFinite(endMs);

    // per-product offset so evergreen timers don't all hit zero together
    const offset = hash(productId) % CYCLE_MS;

    const tick = () => {
      if (real) {
        const left = endMs - Date.now();
        if (left <= 0) {
          setEnded(true);
          return;
        }
        setEnded(false);
        setSecs(Math.ceil(left / 1000));
        return;
      }
      // evergreen: remaining is always in (0, CYCLE_MS]; ceil() means we never
      // show 00:00:00 and a finished period wraps straight to a fresh one
      const ms = CYCLE_MS - ((Date.now() + offset) % CYCLE_MS);
      setEnded(false);
      setSecs(Math.ceil(ms / 1000));
    };

    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [productId, endsAt]);

  if (ended) return null; // real sale is over: hide instead of showing zeros

  const d = secs === null ? null : Math.floor(secs / 86400);
  const h = secs === null ? null : Math.floor((secs % 86400) / 3600);
  const m = secs === null ? null : Math.floor((secs % 3600) / 60);
  const s = secs === null ? null : secs % 60;
  const show = (n: number | null) => (n === null ? "--" : pad(n));

  return (
    <div
      role="timer"
      aria-label="Sale countdown"
      className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-accent/25 bg-accent-soft/60 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-accent shadow-sm">
          <Clock size={16} aria-hidden="true" />
        </span>
        <span className="text-sm font-bold text-ink">Hurry Up! Sale Ends In</span>
      </div>

      <div className="flex items-start gap-1.5" aria-hidden="true">
        {d !== null && d > 0 && (
          <>
            <Unit value={pad(d)} label="Days" />
            <Colon />
          </>
        )}
        <Unit value={show(h)} label="Hrs" />
        <Colon />
        <Unit value={show(m)} label="Min" />
        <Colon />
        <Unit value={show(s)} label="Sec" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Limited stock indicator (real inventory data only)              */
/* ------------------------------------------------------------------ */

export function LowStockIndicator({
  stock,
  lowStock,
}: {
  stock: number;
  lowStock: number | null | undefined;
}) {
  if (!isLowStock(stock, lowStock)) return null;

  const threshold = lowStockThreshold(lowStock);
  const pct = Math.max(10, Math.min(100, (stock / Math.max(threshold, 1)) * 100));

  return (
    <div className="mt-3" role="status">
      <div className="flex items-center gap-2 text-sm font-bold text-accent">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        Only {stock} left in stock
      </div>
      <div className="mt-2 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Popularity indicator                                            */
/* ------------------------------------------------------------------ */
/* NOTE: this is an illustrative figure, not live analytics. The      */
/* wording is deliberately "Popular right now · N viewing".           */

export function ViewingIndicator({ productId }: { productId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = 14 + (hash(productId) % 25); // 14–38, stable per product
    const lo = Math.max(8, base - 6);
    const hi = base + 6;

    let current = base;
    setCount(current);

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // change only every 12–22 seconds, by 1–3 at a time
      timer = setTimeout(() => {
        const step = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
        current = Math.min(hi, Math.max(lo, current + step));
        setCount(current);
        schedule();
      }, 12000 + Math.random() * 10000);
    };
    schedule();

    return () => clearTimeout(timer);
  }, [productId]);

  return (
    <div className="mt-3 inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink">
      <Eye size={14} className="text-accent" aria-hidden="true" />
      <span>
        Popular right now ·{" "}
        <span className="tabular-nums">{count === null ? "--" : count}</span> viewing
      </span>
    </div>
  );
}
