"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "./use-notifications";
import { useStore } from "@/features/store/store-provider";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell({ audience, userId }: { audience: "admin" | "customer"; userId?: string | null }) {
  const { items, unread, markAllRead, onNew } = useNotifications({ audience, userId });
  const { notify } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { onNew((n) => notify(n.title)); }, [onNew, notify]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const orderHref = (orderId: string | null) => (!orderId ? "#" : audience === "admin" ? `/admin/orders/${orderId}` : `/orders/${orderId}`);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-mist"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[60] mt-2 w-[min(20rem,90vw)] rounded-2xl border border-line bg-white p-2 shadow-xl">
          <p className="px-2 py-1.5 text-sm font-extrabold">Notifications</p>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id} href={orderHref(n.order_id)} onClick={() => setOpen(false)}
                  className={cn("block rounded-xl px-2 py-2 text-sm hover:bg-mist", !n.is_read && "bg-mist/60")}
                >
                  <p className="font-bold">{n.title}</p>
                  {n.body && <p className="text-xs text-muted">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-muted">{timeAgo(n.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
