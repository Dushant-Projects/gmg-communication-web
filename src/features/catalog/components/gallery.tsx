"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const current = images[i];

  return (
    <div>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-mist"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        {current && (
          <Image
            src={current.url} alt={alt} fill priority sizes="(min-width:1024px) 50vw, 100vw"
            style={{ transformOrigin: origin }}
            className={cn("object-cover transition-transform duration-200", zoom && "scale-150")}
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.url + idx}
              onClick={() => setI(idx)}
              aria-label={`Show image ${idx + 1}`}
              className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-mist", idx === i ? "border-ink" : "border-transparent")}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
