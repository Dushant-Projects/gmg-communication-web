"use client";

import Image from "next/image";
import Link from "next/link";

type Brand = {
    name: string;
    slug: string;
    logo_url: string | null;
};

export function BrandMarquee({ brands }: { brands: Brand[] }) {
    if (!brands.length) return null;

    const items = [...brands, ...brands];

    return (
        <div className="group relative w-full overflow-hidden">
            {/* Left fade */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/90 to-transparent" />

            {/* Right fade */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/90 to-transparent" />

            <div className="brand-marquee-track flex w-max gap-4 py-3 group-hover:[animation-play-state:paused]">
                {items.map((brand, index) => (
                    <Link
                        key={`${brand.slug}-${index}`}
                        href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                        aria-label={`Shop ${brand.name}`}
                        className="group/brand flex h-20 w-32 shrink-0 items-center justify-center rounded-2xl border border-[#E3DED2] bg-white px-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#B88A3B]/70 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:h-24 sm:w-40"
                    >
                        {brand.logo_url ? (
                            <Image
                                src={brand.logo_url}
                                alt={`${brand.name} logo`}
                                width={120}
                                height={60}
                                className="max-h-12 w-auto max-w-[100px] object-contain transition-transform duration-300 group-hover/brand:scale-110 sm:max-h-14 sm:max-w-[120px]"
                            />
                        ) : (
                            <span className="text-sm font-extrabold text-[#111111]">
                                {brand.name}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            <style jsx global>{`
        .brand-marquee-track {
          animation: brand-marquee 34s linear infinite;
          will-change: transform;
        }

        @keyframes brand-marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-marquee-track {
            animation: none;
          }
        }
      `}</style>
        </div>
    );
}