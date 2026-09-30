import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandMarquee } from "@/components/brand-marquee";

export const metadata: Metadata = {
  title: "Brands | Mobile Store",
  description:
    "Explore smartphones and accessories from leading mobile brands.",
};

type Brand = {
  name: string;
  slug: string;
  logo_url: string | null;
};

export default async function BrandsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("brands")
    .select("name,slug,logo_url")
    .eq("is_active", true)
    .order("name");

  const brands = (data ?? []) as Brand[];

  return (
    <main className="min-h-screen bg-[#F8F7F3]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#E5E0D5] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#B88A3B]/20" />

          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border border-[#B88A3B]/20" />

          <div className="relative px-5 pb-8 pt-10 text-center sm:px-10 sm:pb-10 sm:pt-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B88A3B] sm:text-xs">
              Explore our collection
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111111] sm:text-5xl">
              Brands you trust.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">
              Discover smartphones and accessories from leading brands,
              carefully selected to give you more choice for your next device.
            </p>

            {/* Decorative divider */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#B88A3B]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B88A3B]" />
              <span className="h-px w-8 bg-[#B88A3B]" />
            </div>
          </div>

          {/* Animated brands */}
          {brands.length > 0 && (
            <div className="relative border-t border-[#EEEAE1] bg-[#FBFAF7] px-3 py-3 sm:px-6">
              <BrandMarquee brands={brands} />
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          BRAND GRID
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B88A3B] sm:text-xs">
              Our brands
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
              Shop by brand
            </h2>
          </div>

          {brands.length > 0 && (
            <p className="hidden text-sm text-[#667085] sm:block">
              {brands.length}{" "}
              {brands.length === 1 ? "brand" : "brands"} available
            </p>
          )}
        </div>

        {brands.length === 0 ? (
          <div className="rounded-3xl border border-[#E3DED2] bg-white px-6 py-16 text-center">
            <p className="font-semibold text-[#111111]">
              No brands available right now.
            </p>

            <p className="mt-2 text-sm text-[#667085]">
              Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                className="group relative overflow-hidden rounded-[1.5rem] border border-[#E3DED2] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#B88A3B]/60 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)] sm:p-6"
              >
                {/* Top gold line */}
                <div className="absolute left-0 right-0 top-0 h-1 origin-left scale-x-0 bg-[#B88A3B] transition-transform duration-300 group-hover:scale-x-100" />

                <div className="flex min-h-[190px] flex-col items-center justify-center">
                  {/* Logo */}
                  <div className="flex h-24 w-full items-center justify-center">
                    {brand.logo_url ? (
                      <Image
                        src={brand.logo_url}
                        alt={`${brand.name} logo`}
                        width={150}
                        height={80}
                        className="max-h-20 w-auto max-w-[150px] object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#111111]">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="mt-4 text-lg font-extrabold text-[#111111]">
                    {brand.name}
                  </h3>

                  {/* CTA */}
                  <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#B88A3B]">
                    <span>Explore products</span>

                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}