"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const CYCLE_MS = 700;

/** Cycles through a product's photos while hovered — like a quick "unboxing" preview. */
export function HoverGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setIndex(0);
  };
  const start = () => {
    if (images.length <= 1 || timer.current) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % images.length), CYCLE_MS);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-mist" onMouseEnter={start} onMouseLeave={stop}>
      {images[index] && (
        <Image key={images[index]} src={images[index]} alt={alt} fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover transition-opacity duration-150" />
      )}
      {images.length > 1 && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {images.map((_, i) => (
            <span key={i} className={`h-1 w-1 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
