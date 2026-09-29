"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    await createClient().from("products").update({ is_active: !active }).eq("id", id);
    setBusy(false);
    router.refresh();
  };
  return (
    <button onClick={toggle} disabled={busy} className={cn("rounded-full px-3 py-1 text-xs font-bold", active ? "bg-green-50 text-green-700" : "bg-mist text-muted")}>
      {active ? "Active" : "Hidden"}
    </button>
  );
}

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(`Delete "${name}"? This also removes its images and variants. This can't be undone.`)) return;
    setBusy(true);
    await createClient().from("products").delete().eq("id", id);
    setBusy(false);
    router.refresh();
  };
  return <button onClick={remove} disabled={busy} className="text-xs font-bold text-sale hover:underline">Delete</button>;
}

export function EditLink({ id }: { id: string }) {
  return <Link href={`/admin/products/${id}`} className="text-xs font-bold hover:underline">Edit</Link>;
}
