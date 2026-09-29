import Link from "next/link";
import { SOCIAL, STORE_NAME } from "@/lib/constants";

const cols = [
  { title: "Shop", links: [["Smartphones", "/shop?category=smartphones"], ["Accessories", "/shop?group=accessories"], ["Deals", "/shop?deals=1"], ["Brands", "/brands"]] },
  { title: "Company", links: [["About", "/info/about"], ["Contact", "/info/contact"], ["FAQ", "/info/faq"]] },
  { title: "Policies", links: [["Privacy Policy", "/info/privacy-policy"], ["Terms & Conditions", "/info/terms"], ["Shipping Policy", "/info/shipping-policy"], ["Return Policy", "/info/return-policy"]] },
];

export function Footer() {
  const social = SOCIAL.filter((s) => s.href);
  return (
    <footer className="mt-20 border-t border-line bg-mist">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold tracking-tight">{STORE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">Smartphones and accessories, delivered to your door.</p>
          {social.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm font-semibold">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.label}</a>
              ))}
            </div>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-bold">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {c.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
