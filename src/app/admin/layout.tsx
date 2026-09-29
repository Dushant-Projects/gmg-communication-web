import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminNav } from "@/features/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins; RLS still protects the data itself
  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}
