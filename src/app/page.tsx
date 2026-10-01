import Link from "next/link";
import { BadgeCheck, Headset, ShieldCheck, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CARD_SELECT, toCard } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { NewsletterForm } from "@/features/marketing/newsletter-form";
import { HeroCarousel } from "@/features/marketing/hero-carousel";
import { CountdownBanner } from "@/features/marketing/countdown-banner";
import { Reveal } from "@/components/reveal";
import { BrandMarquee } from "@/components/brand-marquee";
import { StoreComparison } from "@/components/store-comparison";

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <Reveal>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {title}
          </h2>

          {href && (
            <Link
              href={href}
              className="text-sm font-bold text-accent hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        <div className="mt-6">{children}</div>
      </Reveal>
    </section>
  );
}

const Grid = ({
  items,
}: {
  items: ReturnType<typeof toCard>[];
}) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
    {items.map((p) => (
      <ProductCard key={p.id} p={p} />
    ))}
  </div>
);

type Brand = {
  name: string;
  slug: string;
  logo_url: string | null;
};

export default async function Home() {
  const supabase = await createClient();

  const base = () =>
    supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true)
      .limit(8);

  const [featured, latest, deals, brands, promo] = await Promise.all([
    base()
      .eq("is_featured", true)
      .order("created_at", { ascending: false }),

    base().order("created_at", { ascending: false }),

    base()
      .not("sale_price", "is", null)
      .order("discount_pct", { ascending: false }),

    supabase
      .from("brands")
      .select("name,slug,logo_url")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("promo_banner")
      .select("title,subtitle,ends_at,href")
      .eq("id", "main")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const featuredCards = (featured.data ?? []).map(toCard);
  const latestCards = (latest.data ?? []).map(toCard);
  const dealCards = (deals.data ?? []).map(toCard);

  const brandList = (brands.data ?? []) as Brand[];

  const heroSlides = featuredCards
    .filter((p) => p.image)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      image: p.image as string,
      price: p.price,
      salePrice: p.salePrice,
    }));

  return (
    <main>
      {/* =========================================================
          HERO
      ========================================================= */}
      <HeroCarousel slides={heroSlides} />

      {/* =========================================================
          COUNTDOWN / PROMOTION
      ========================================================= */}
      <CountdownBanner banner={promo.data} />

      {/* =========================================================
          SHOP BY BRAND
      ========================================================= */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Trusted names
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Shop by brand
              </h2>
            </div>

            <Link
              href="/brands"
              className="text-sm font-bold text-accent hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-6">
            {brandList.length > 0 ? (
              <BrandMarquee brands={brandList} />
            ) : (
              <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
                No brands available right now.
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* =========================================================
          FEATURED PRODUCTS
      ========================================================= */}
      <Section title="Featured products" href="/shop">
        <Grid items={featuredCards} />
      </Section>

      {/* =========================================================
          LATEST ARRIVALS
      ========================================================= */}
      <Section title="Latest arrivals" href="/shop?sort=newest">
        <Grid items={latestCards} />
      </Section>

      {/* =========================================================
          BEST DEALS
      ========================================================= */}
      {dealCards.length > 0 && (
        <Section
          title="Best deals"
          href="/shop?deals=1&sort=discount"
        >
          <Grid items={dealCards} />
        </Section>
      )}
      <StoreComparison />
      {/* =========================================================
          WHY CHOOSE US
      ========================================================= */}
      {/* =========================================================
    WHY CHOOSE US - Premium Version
========================================================= */}
      <section className="relative mx-auto mt-24 max-w-7xl overflow-hidden px-4">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[#B88A3B]/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-[#B88A3B]/[0.04] blur-3xl" />

        <Reveal className="relative text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#B88A3B]/60" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88A3B]">
              The GMG Store Difference
            </p>
            <span className="h-px w-8 bg-[#B88A3B]/60" />
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl md:text-5xl">
            More than a GMG store.
            <br />
            <span className="text-[#B88A3B]">A better way to buy.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            We’re not just about phones — we’re about giving you a trusted,
            smooth and premium shopping experience.
          </p>

          {/* Quick trust icons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-[#8b6a35]">
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-[#B88A3B]" /> Genuine Products
            </span>
            <span className="hidden h-3 w-px bg-[#e7dcc7] sm:block" />
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#B88A3B]" /> Secure Shopping
            </span>
            <span className="hidden h-3 w-px bg-[#e7dcc7] sm:block" />
            <span className="flex items-center gap-1.5">
              <Truck size={15} className="text-[#B88A3B]" /> Fast Delivery
            </span>
            <span className="hidden h-3 w-px bg-[#e7dcc7] sm:block" />
            <span className="flex items-center gap-1.5">
              <Headset size={15} className="text-[#B88A3B]" /> Dedicated Support
            </span>
          </div>
        </Reveal>

        {/* Feature Cards */}
        <div className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              num: "01",
              icon: BadgeCheck,
              title: "100% Authentic Products",
              text: "Genuine smartphones and accessories from trusted brands, so you always get the real deal.",
            },
            {
              num: "02",
              icon: ShieldCheck,
              title: "Secure Shopping",
              text: "Your personal and order information stays protected with advanced security and trusted payment methods.",
            },
            {
              num: "03",
              icon: Truck,
              title: "Fast & Reliable Delivery",
              text: "Quick shipping with order tracking from checkout to delivery.",
            },
            {
              num: "04",
              icon: Headset,
              title: "Dedicated Support",
              text: "Get help before, during and after your purchase. We’re always here for you.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.num} delay={i * 80}>
                <div className="group relative h-full rounded-2xl border border-[#f0e9dc] bg-white p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e7dcc7] hover:shadow-[0_12px_40px_-8px_rgba(184,138,59,0.12)]">
                  {/* Number */}
                  <span className="absolute right-5 top-5 text-xs font-bold tracking-wider text-[#B88A3B]/40">
                    {item.num}
                  </span>

                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#faf6f0] text-[#B88A3B] transition-colors duration-300 group-hover:bg-[#B88A3B] group-hover:text-white">
                    <Icon size={24} strokeWidth={1.7} />
                  </div>

                  {/* Title */}
                  <h3 className="mt-6 text-[17px] font-extrabold tracking-tight text-[#1a1a1a]">
                    {item.title}
                  </h3>

                  {/* Gold underline */}
                  <div className="mt-2 h-[2.5px] w-10 rounded-full bg-[#B88A3B]" />

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom Trust Bar */}
        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl border border-[#f0e9dc] bg-[#faf9f6] px-6 py-5 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#B88A3B] shadow-sm">
                <BadgeCheck size={16} />
              </span>
              <div>
                <p className="font-bold text-[#1a1a1a]">Original Brands</p>
                <p className="text-xs text-muted">Top brands, always</p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-[#e7dcc7] sm:block" />

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#B88A3B] shadow-sm">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="font-bold text-[#1a1a1a]">Safe & Secure</p>
                <p className="text-xs text-muted">Your data, our priority</p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-[#e7dcc7] sm:block" />

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#B88A3B] shadow-sm">
                <Truck size={16} />
              </span>
              <div>
                <p className="font-bold text-[#1a1a1a]">Fast Delivery</p>
                <p className="text-xs text-muted">Across the country</p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-[#e7dcc7] sm:block" />

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#B88A3B] shadow-sm">
                <Headset size={16} />
              </span>
              <div>
                <p className="font-bold text-[#1a1a1a]">24/7 Support</p>
                <p className="text-xs text-muted">Always here for you</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      {/* =========================================================
          NEWSLETTER
      ========================================================= */}
      <section className="mx-auto mt-16 max-w-7xl px-4 pb-16">
        <Reveal>
          <div className="relative rounded-[2rem] border border-line px-6 py-12 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Get new arrivals and deals in your inbox
            </h2>

            <p className="mt-2 text-sm text-muted">
              One email when something worth seeing lands. Unsubscribe
              anytime.
            </p>

            <NewsletterForm />
          </div>
        </Reveal>
      </section>
    </main>
  );
}