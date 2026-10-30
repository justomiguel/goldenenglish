import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type PublicCourseCard = {
  id: string;
  slug: string;
  title: string;
  price: number;
};

const PAGE_SIZE = 24;

export async function loadPublicCourses(supabase: SupabaseClient): Promise<PublicCourseCard[]> {
  const { data, error, count } = await supabase
    .from("learning_courses")
    .select("id, slug, title, price", { count: "exact" })
    .eq("status", "published")
    .eq("listed_in_shop", true)
    .order("title", { ascending: true })
    .range(0, PAGE_SIZE - 1);
  if (error) {
    logSupabaseClientError("loadPublicCourses", error, { total: count ?? 0 });
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const slug = typeof row.slug === "string" ? row.slug : "";
    if (!slug) return [];
    return [{ id: String(row.id), slug, title: String(row.title), price: Number(row.price) }];
  });
}
