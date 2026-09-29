"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type PromoBanner = { title: string | null; subtitle: string | null; ends_at: string | null; href: string | null };

function remaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function CountdownBanner({ banner }: { banner: PromoBanner | null }) {
  const [time, setTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!banner?.ends_at) return;
    const tick = () => setTime(remaining(banner.ends_at!));
    tick(); // first read happens client-side only, so it never mismatches the server render
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [banner?.ends_at]);

  if (!banner || !time) return null;

  const Unit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur">
      <span className="text-lg font-extrabold tabular-nums leading-none">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-wide text-white/70">{label}</span>
    </div>
  );

  const content = (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-3 text-white sm:justify-between">
      <div className="text-center sm:text-left">
        <p className="text-sm font-extrabold sm:text-base">{banner.title}</p>
        {banner.subtitle && <p className="text-xs text-white/70">{banner.subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Unit value={time.days} label="Days" />
          <Unit value={time.hours} label="Hrs" />
          <Unit value={time.minutes} label="Min" />
          <Unit value={time.seconds} label="Sec" />
        </div>
        <span className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink sm:inline-block">Shop the sale →</span>
      </div>
    </div>
  );

  return (
    <section className="bg-gradient-to-r from-accent to-ink">
      <Link href={banner.href || "/shop?deals=1"}>{content}</Link>
    </section>
  );
}
