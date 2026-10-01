"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Brand = {
  name: string;
  slug: string;
  logo_url: string | null;
};

type Props = {
  brands: Brand[];
  /** "logo" = large logo cards (home / brands page), "pill" = compact rounded pills (product page) */
  variant?: "logo" | "pill";
  /** Highlights the matching brand (pill variant) */
  activeSlug?: string | null;
  className?: string;
};

export function BrandMarquee({
  brands,
  variant = "logo",
  activeSlug = null,
  className,
}: Props) {
  if (!brands.length) return null;

  const pill = variant === "pill";

  // Repeat the list enough times that one "group" is always wider than the
  // screen, so there is never an empty gap even with only a few brands.
  const reps = Math.max(1, Math.ceil((pill ? 16 : 12) / brands.length));
  const group = Array.from({ length: reps }, () => brands).flat();

  // Constant speed no matter how many brands there are.
  const duration = Math.max(20, group.length * (pill ? 2.4 : 3.2));

  return (
    <div
      className={cn("brand-marquee group relative w-full max-w-full overflow-hidden", className)}
      style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
    >
      {/* Left fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-white via-white/90 to-transparent",
          pill ? "w-10 sm:w-16" : "w-12 sm:w-20"
        )}
      />

      {/* Right fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-white via-white/90 to-transparent",
          pill ? "w-10 sm:w-16" : "w-12 sm:w-20"
        )}
      />

      <div
        className={cn(
          "brand-marquee-track flex w-max group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          pill ? "py-2" : "py-3"
        )}
      >
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="brand-marquee-group flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4"
          >
            {group.map((brand, index) => {
              // only the first real copy is exposed to keyboard / screen readers
              const hidden = copy === 1 || index >= brands.length;
              const active = activeSlug === brand.slug;

              return (
                <li key={`${brand.slug}-${index}`} className="shrink-0">
                  {pill ? (
                    <Link
                      href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                      aria-label={`Shop ${brand.name}`}
                      tabIndex={hidden ? -1 : undefined}
                      className={cn(
                        "flex h-11 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-5 transition-colors duration-300",
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-ink hover:border-accent/70"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-soft">
                        {brand.logo_url ? (
                          <Image
                            src={brand.logo_url}
                            alt=""
                            width={24}
                            height={24}
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <span className="text-xs font-extrabold text-accent">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold">
                        {brand.name}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                      aria-label={`Shop ${brand.name}`}
                      tabIndex={hidden ? -1 : undefined}
                      className="group/brand flex h-28 w-36 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E3DED2] bg-white px-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#B88A3B]/70 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:h-32 sm:w-40"
                    >
                      <span className="flex h-11 w-full items-center justify-center sm:h-12">
                        {brand.logo_url ? (
                          <Image
                            src={brand.logo_url}
                            alt=""
                            width={120}
                            height={60}
                            className="max-h-10 w-auto max-w-[90px] object-contain transition-transform duration-300 group-hover/brand:scale-110 sm:max-h-12 sm:max-w-[110px]"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3DED2] bg-[#FAF7F0] text-base font-extrabold text-[#B88A3B]">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="w-full truncate text-center text-xs font-bold tracking-wide text-[#111111] sm:text-[13px]">
                        {brand.name}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      <style jsx global>{`
        .brand-marquee-track {
          animation: brand-marquee var(--marquee-duration, 34s) linear infinite;
          will-change: transform;
        }

        @keyframes brand-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* Reduced motion: no auto-scroll, but the strip stays swipeable */
        @media (prefers-reduced-motion: reduce) {
          .brand-marquee {
            overflow-x: auto;
          }

          .brand-marquee-track {
            animation: none;
          }

          .brand-marquee-group[aria-hidden="true"] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
