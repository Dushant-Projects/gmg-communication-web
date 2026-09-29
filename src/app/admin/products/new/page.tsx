import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/features/admin/product-form";

export const metadata: Metadata = { title: "Admin · Add Product" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("id,name").eq("is_active", true).order("name"),
    supabase.from("categories").select("id,name").eq("is_active", true).order("name"),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Add product</h1>
      <div className="mt-5"><ProductForm brands={brands ?? []} categories={categories ?? []} /></div>
    </div>
  );
}
