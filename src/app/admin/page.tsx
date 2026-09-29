import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc("admin_dashboard_stats");

  const revenue = Number(stats?.total_revenue ?? 0);
  const profit = Number(stats?.total_profit ?? 0);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const cards = [
    ["Revenue (delivered)", formatPrice(revenue)],
    ["Cost (delivered)", formatPrice(stats?.total_cost ?? 0)],
    [profit >= 0 ? "Profit (delivered)" : "Loss (delivered)", formatPrice(Math.abs(profit))],
    ["Profit margin", `${margin}%`],
    ["Total orders", stats?.total_orders ?? 0],
    ["Pending orders", stats?.pending_orders ?? 0],
    ["Delivered orders", stats?.delivered_orders ?? 0],
    ["Total products", stats?.total_products ?? 0],
    ["Low stock products", stats?.low_stock_products ?? 0],
    ["Total customers", stats?.total_customers ?? 0],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-xs text-muted">Revenue, cost and profit are based on delivered orders only.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => {
          const isProfitCard = String(label).startsWith("Profit") || String(label).startsWith("Loss");
          const negative = isProfitCard && profit < 0;
          return (
            <div key={label as string} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className={`mt-1 text-xl font-semibold ${negative ? "text-sale" : isProfitCard ? "text-green-700" : ""}`}>{value}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/products/new" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">+ Add product</Link>
        <Link href="/admin/products" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-ink">Manage products</Link>
        <Link href="/admin/orders" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-ink">Manage orders</Link>
      </div>
    </main>
  );
}
