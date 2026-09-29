import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Shop by Brand" };

export default async function BrandsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("name,slug,logo_url").eq("is_active", true).order("name");
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Brands</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(data ?? []).map((b: any) => (
          <Link key={b.slug} href={`/shop?brand=${b.slug}`} className="flex h-32 items-center justify-center rounded-2xl border border-line text-lg font-bold transition hover:border-ink">
            {b.logo_url ? <Image src={b.logo_url} alt={b.name} width={120} height={60} className="max-h-14 w-auto object-contain" /> : b.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
