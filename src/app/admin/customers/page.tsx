import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Customers" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("admin_customers").select("*").order("total_spent", { ascending: false });
  if (q?.trim()) query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
  const { data } = await query;
  const customers = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Customers</h1>
      <form className="mt-4"><input name="q" defaultValue={q ?? ""} placeholder="Search customers…" className="h-11 w-full max-w-sm rounded-full border border-line px-4 text-sm outline-none focus:border-ink" /></form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold uppercase text-muted">
              <th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Orders</th><th className="p-3">Total spent</th><th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c: any) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3"><p className="font-semibold">{c.full_name || "—"}</p><p className="text-xs text-muted">{c.email}</p></td>
                <td className="p-3 text-muted">{c.phone || "—"}</td>
                <td className="p-3">{c.orders_count}</td>
                <td className="p-3 font-semibold">{formatPrice(c.total_spent)}</td>
                <td className="p-3 text-muted">{new Date(c.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Passwords and other authentication details are never accessible here.</p>
    </div>
  );
}
