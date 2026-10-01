"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type HeroSlide = { name: string; slug: string; image: string; price: number; salePrice: number | null };
const AUTOPLAY_MS = 1000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (hovering || slides.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [hovering, slides.length]);

  if (slides.length === 0) {
    return (
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pt-8 md:grid-cols-2 md:pt-14">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">Upgrade your world.</h1>
          <p className="mt-5 max-w-md text-lg text-muted">Discover the latest smartphones at competitive prices.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop?category=smartphones" className="rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white hover:opacity-90">Shop Smartphones</Link>
            <Link href="/shop?deals=1" className="rounded-full border border-ink px-7 py-3.5 text-sm font-bold hover:bg-ink hover:text-white">Explore Deals</Link>
          </div>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-mist md:aspect-[4/3]" />
      </section>
    );
  }

  const s = slides[i];

  return (
    <section
      className="relative overflow-hidden bg-ink text-white"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/60">Featured</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{s.name}</h1>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold">{formatPrice(s.salePrice ?? s.price)}</span>
            {s.salePrice != null && <span className="text-base text-white/50 line-through">{formatPrice(s.price)}</span>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/product/${s.slug}`} className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink hover:opacity-90">Shop Now</Link>
            <Link href="/shop?deals=1" className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-bold hover:bg-white hover:text-ink">Explore Deals</Link>
          </div>
        </div>
        <Link href={`/product/${s.slug}`} className="relative order-first aspect-square overflow-hidden rounded-[2rem] bg-white/5 md:order-none md:aspect-[4/3]">
          <Image key={s.image} src={s.image} alt={s.name} fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx} onClick={() => setI(idx)} aria-label={`Show slide ${idx + 1}`}
              className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-6 bg-white" : "w-1.5 bg-white/40")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
