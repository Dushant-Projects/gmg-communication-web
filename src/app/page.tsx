import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headset, ShieldCheck, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CARD_SELECT, toCard } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { NewsletterForm } from "@/features/marketing/newsletter-form";
import { HeroCarousel } from "@/features/marketing/hero-carousel";
import { CountdownBanner } from "@/features/marketing/countdown-banner";

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {href && <Link href={href} className="text-sm font-bold text-accent hover:underline">View all</Link>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const Grid = ({ items }: { items: ReturnType<typeof toCard>[] }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
    {items.map((p) => <ProductCard key={p.id} p={p} />)}
  </div>
);

export default async function Home() {
  const supabase = await createClient();
  const base = () => supabase.from("products").select(PRODUCT_CARD_SELECT).eq("is_active", true).limit(8);

  const [featured, latest, deals, brands, promo] = await Promise.all([
    base().eq("is_featured", true).order("created_at", { ascending: false }),
    base().order("created_at", { ascending: false }),
    base().not("sale_price", "is", null).order("discount_pct", { ascending: false }),
    supabase.from("brands").select("name,slug,logo_url").eq("is_active", true).order("name"),
    supabase.from("promo_banner").select("title,subtitle,ends_at,href").eq("id", "main").eq("is_active", true).maybeSingle(),
  ]);

  const featuredCards = (featured.data ?? []).map(toCard);
  const latestCards = (latest.data ?? []).map(toCard);
  const dealCards = (deals.data ?? []).map(toCard);
  const heroSlides = featuredCards
    .filter((p) => p.image)
    .slice(0, 5)
    .map((p) => ({ name: p.name, slug: p.slug, image: p.image as string, price: p.price, salePrice: p.salePrice }));

  return (
    <main>
      <HeroCarousel slides={heroSlides} />
      <CountdownBanner banner={promo.data} />

      {/* Shop by brand */}
      <Section title="Shop by brand" href="/brands">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {(brands.data ?? []).map((b: any) => (
            <Link key={b.slug} href={`/shop?brand=${b.slug}`} className="flex h-20 items-center justify-center rounded-2xl border border-line px-3 text-center text-sm font-bold transition hover:border-ink">
              {b.logo_url ? <Image src={b.logo_url} alt={b.name} width={80} height={40} className="max-h-10 w-auto object-contain" /> : b.name}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured products" href="/shop"><Grid items={featuredCards} /></Section>
      <Section title="Latest arrivals" href="/shop?sort=newest"><Grid items={latestCards} /></Section>
      {dealCards.length > 0 && <Section title="Best deals" href="/shop?deals=1&sort=discount"><Grid items={dealCards} /></Section>}

      {/* Why shop with us */}
      <section className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [BadgeCheck, "Authentic products", "Genuine devices and accessories from trusted brands."],
          [ShieldCheck, "Secure shopping", "Your account and order details stay protected."],
          [Truck, "Fast delivery", "Orders are packed and shipped quickly."],
          [Headset, "Customer support", "Real people ready to help with your order."],
        ].map(([Icon, title, text]: any) => (
          <div key={title} className="rounded-2xl bg-mist p-6">
            <Icon size={26} />
            <p className="mt-4 font-bold">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="relative rounded-[2rem] border border-line px-6 py-12 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">Get new arrivals and deals in your inbox</h2>
          <p className="mt-2 text-sm text-muted">One email when something worth seeing lands. Unsubscribe anytime.</p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
