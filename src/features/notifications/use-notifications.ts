"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uid } from "@/lib/utils";

export type Notification = {
  id: string; type: string; title: string; body: string | null; order_id: string | null;
  is_read: boolean; created_at: string;
};

export function useNotifications({ audience, userId }: { audience: "admin" | "customer"; userId?: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const onNewRef = useRef<((n: Notification) => void) | null>(null);

  const enabled = audience === "admin" || !!userId;

  const load = useCallback(async () => {
    if (!enabled) return;
    let listQ = supabase.from("notifications").select("id,type,title,body,order_id,is_read,created_at").order("created_at", { ascending: false }).limit(20);
    let countQ = supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
    if (audience === "admin") {
      listQ = listQ.eq("audience", "admin");
      countQ = countQ.eq("audience", "admin");
    } else {
      listQ = listQ.eq("user_id", userId!);
      countQ = countQ.eq("user_id", userId!);
    }
    const [{ data: list }, { count }] = await Promise.all([listQ, countQ]);
    setItems(list ?? []);
    setUnread(count ?? 0);
  }, [supabase, audience, userId, enabled]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!enabled) return;
    const filter = audience === "admin" ? "audience=eq.admin" : `user_id=eq.${userId}`;
    const channel = supabase
      .channel(`notifications-${audience}-${userId ?? "all"}-${uid()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter }, (payload) => {
        const n = payload.new as Notification;
        setItems((prev) => [n, ...prev].slice(0, 20));
        setUnread((c) => c + 1);
        onNewRef.current?.(n);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, audience, userId]);

  const markAllRead = useCallback(async () => {
    if (!enabled || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    let q = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    q = audience === "admin" ? q.eq("audience", "admin") : q.eq("user_id", userId!);
    await q;
  }, [supabase, audience, userId, enabled, unread]);

  const onNew = useCallback((cb: (n: Notification) => void) => { onNewRef.current = cb; }, []);

  return { items, unread, markAllRead, onNew };
}
