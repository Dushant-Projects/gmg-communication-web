import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTACT, SHIPPING_FEE, STORE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const PAGES: Record<string, { title: string; body: string[] }> = {
  about: { title: "About us", body: [`${STORE_NAME} sells smartphones and mobile accessories from trusted brands at competitive prices.`, "Browse, compare and order online, then track your order from your account."] },
  contact: { title: "Contact us", body: [`Email: ${CONTACT.email}`, `Phone: ${CONTACT.phone}`, `Location: ${CONTACT.address}`] },
  "privacy-policy": { title: "Privacy Policy", body: ["We collect only the information needed to create your account and deliver your orders: your name, email, phone number and delivery address.", "We never sell your personal information. Passwords are handled by our authentication provider and are never visible to us or to store staff."] },
  terms: { title: "Terms & Conditions", body: ["By placing an order you agree to provide accurate delivery and contact details.", "Prices and availability can change. An order is confirmed only after our team reviews it. Payment is collected on delivery or by bank transfer."] },
  "shipping-policy": { title: "Shipping Policy", body: [`Shipping is a flat ${formatPrice(SHIPPING_FEE)} per order.`, "We confirm your order first, then dispatch it. You can follow every status change from your account."] },
  "return-policy": { title: "Return Policy", body: ["If your device or accessory arrives damaged or not as described, contact us as soon as you receive it.", "Items must be unused and in original packaging to be eligible for return or exchange."] },
  faq: { title: "FAQ", body: ["How can I pay? Cash on Delivery or Bank Transfer.", "How do I track my order? Log in and open your order from your account.", "Can I cancel an order? Contact us before it ships and we will help."] },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? "Not found" };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        {page.body.map((t) => <p key={t}>{t}</p>)}
      </div>
    </main>
  );
}
