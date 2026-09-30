"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, Smartphone, User, X } from "lucide-react";
import { NAV_LINKS, STORE_NAME } from "@/lib/constants";
import { useStore } from "@/features/store/store-provider";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string, sp: URLSearchParams) {
  const [path, query] = href.split("?");
  if (path === "/") return pathname === "/";
  if (!pathname.startsWith(path)) return false;
  if (path === "/shop") {
    const params = new URLSearchParams(query ?? "");
    const key = params.has("deals") ? "deals" : params.has("group") ? "group" : null;
    return key ? sp.get(key) === params.get(key) : !sp.has("deals") && !sp.has("group");
  }
  return true;
}

const iconBtn = "relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-mist";

export function Navbar() {
  const { cartCount, wishlist, userId, userName, openCartDrawer, ready } = useStore();
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setMenuOpen(false), [pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) {
      router.push(`/shop?q=${encodeURIComponent(term)}`);
      setSearchOpen(false);
    }
  };

  const searchForm = (
    <form onSubmit={submit} role="search" className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search phones, brands, accessories"
        aria-label="Search products"
        className="h-10 w-full rounded-full border border-line bg-mist pl-9 pr-4 text-sm outline-none focus:border-ink focus:bg-white"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <button
          className={cn(iconBtn, "lg:hidden")}
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <Smartphone size={22} /> {STORE_NAME}
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink",
                isActive(l.href, pathname, sp) && "bg-mist text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-72 md:block">{searchForm}</div>

        <button
          className={cn(iconBtn, "md:hidden")}
          aria-label="Search"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search size={20} />
        </button>

        {/* Only show after store is ready → fixes hydration mismatch */}
        {ready && userId && (
          <NotificationBell audience="customer" userId={userId} />
        )}

        <Link href="/wishlist" className={iconBtn} aria-label="Wishlist">
          <Heart size={20} />
          {wishlist.size > 0 && <Badge n={wishlist.size} />}
        </Link>

        <button
          onClick={openCartDrawer}
          className={iconBtn}
          aria-label={`Cart, ${cartCount} items`}
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && <Badge n={cartCount} />}
        </button>

        {ready ? (
          userId ? (
            <Link
              href="/account"
              className="flex h-10 items-center gap-2 rounded-full bg-mist pl-1 pr-1 transition hover:bg-line sm:pr-3"
              aria-label="My account"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {(userName ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-24 truncate text-sm font-bold sm:block">
                {(userName ?? "Account").split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold transition hover:bg-mist"
              aria-label="Log in"
            >
              <User size={20} /> <span className="hidden sm:block">Log in</span>
            </Link>
          )
        ) : (
          /* Same size placeholder while auth is loading */
          <div className="h-10 w-10 sm:w-24" aria-hidden />
        )}
      </div>

      {searchOpen && (
        <div className="border-t border-line p-3 md:hidden">{searchForm}</div>
      )}

      {menuOpen && (
        <nav className="border-t border-line bg-white p-3 lg:hidden" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-mist"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}