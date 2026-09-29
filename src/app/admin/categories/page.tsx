import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/features/admin/categories-manager";

export const metadata: Metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
      <div className="mt-5"><CategoriesManager initial={data ?? []} /></div>
    </div>
  );
}
