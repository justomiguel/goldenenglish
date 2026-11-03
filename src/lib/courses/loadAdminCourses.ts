import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const ADMIN_COURSE_PAGE_SIZE = 20;

export type AdminCourseListRow = {
  id: string;
  title: string;
  status: "draft" | "published";
  progressMode: "open" | "sequential";
  price: number;
  listedInShop: boolean;
  categoryName: string | null;
};

export type AdminCourseListPage = {
  rows: AdminCourseListRow[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export async function loadAdminCourses(
  supabase: SupabaseClient,
  page: number,
  categoryId?: string | null,
): Promise<AdminCourseListPage> {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * ADMIN_COURSE_PAGE_SIZE;
  const to = from + ADMIN_COURSE_PAGE_SIZE - 1;
  let query = supabase
    .from("learning_courses")
    .select("id, title, status, progress_mode, price, listed_in_shop, course_categories(name)", { count: "exact" })
    .order("title", { ascending: true });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error, count } = await query.range(from, to);

  if (error) {
    logSupabaseClientError("loadAdminCourses", error, { page: safePage });
    return { rows: [], page: safePage, pageSize: ADMIN_COURSE_PAGE_SIZE, totalCount: 0 };
  }

  const rows = (data ?? []).map((row) => {
    const category = row.course_categories as { name?: string } | { name?: string }[] | null;
    const categoryName = Array.isArray(category) ? category[0]?.name ?? null : category?.name ?? null;
    return {
      id: String(row.id),
      title: String(row.title),
      status: row.status === "draft" ? "draft" as const : "published" as const,
      progressMode: row.progress_mode === "sequential" ? "sequential" as const : "open" as const,
      price: Number(row.price),
      listedInShop: Boolean(row.listed_in_shop),
      categoryName,
    };
  });

  return {
    rows,
    page: safePage,
    pageSize: ADMIN_COURSE_PAGE_SIZE,
    totalCount: count ?? rows.length,
  };
}
