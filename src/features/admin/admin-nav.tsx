"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/features/notifications/notification-bell";

const LINKS = [
  ["/admin", "Dashboard", true],
  ["/admin/products", "Products", true],
  ["/admin/orders", "Orders", true],
  ["/admin/payment-settings", "Payment Settings", true],
  ["/admin/promo-banner", "Promo Banner", true],
  ["/admin/categories", "Categories", true],
  ["/admin/brands", "Brands", true],
  ["/admin/coupons", "Coupons", true],
  ["/admin/reviews", "Reviews", true],
  ["/admin/customers", "Customers", true],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="lg:flex lg:flex-col">
      <div className="mb-2 hidden items-center justify-between lg:flex">
        <span className="text-sm font-extrabold text-muted">Admin</span>
        <NotificationBell audience="admin" />
      </div>
      <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map(([href, label, ready]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          if (!ready)
            return (
              <span key={href} className="flex shrink-0 items-center justify-between gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-muted/60">
                {label} <span className="rounded-full bg-mist px-2 py-0.5 text-[10px]">Soon</span>
              </span>
            );
          return (
            <Link key={href} href={href} className={cn("shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition hover:bg-mist", active && "bg-ink text-white hover:bg-ink")}>
              {label}
            </Link>
          );
        })}
        <Link href="/" className="shrink-0 rounded-full px-4 py-2.5 text-sm font-bold text-muted hover:bg-mist">← Back to store</Link>
      </div>
      <div className="mt-2 lg:hidden"><NotificationBell audience="admin" /></div>
    </nav>
  );
}
