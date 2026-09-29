"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/account", "Profile"], ["/account/orders", "Orders"], ["/wishlist", "Wishlist"],
  ["/account/addresses", "Addresses"], ["/account/settings", "Account Settings"],
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className={cn("shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition hover:bg-mist", pathname === href && "bg-mist")}>
          {label}
        </Link>
      ))}
      <form action={signOut} className="shrink-0">
        <button className="rounded-full px-4 py-2.5 text-sm font-bold text-sale transition hover:bg-mist">Logout</button>
      </form>
    </nav>
  );
}
