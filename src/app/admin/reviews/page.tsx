import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReviewsManager } from "@/features/admin/reviews-manager";

export const metadata: Metadata = { title: "Admin · Reviews" };

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,rating,comment,status,created_at,products(name),profiles(full_name,email)")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Reviews</h1>
      <div className="mt-5"><ReviewsManager initial={(data ?? []) as any} /></div>
    </div>
  );
}
