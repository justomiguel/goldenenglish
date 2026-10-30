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
): Promise<AdminCourseListPage> {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * ADMIN_COURSE_PAGE_SIZE;
  const to = from + ADMIN_COURSE_PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from("learning_courses")
    .select("id, title, status, progress_mode, price, listed_in_shop", { count: "exact" })
    .order("title", { ascending: true })
    .range(from, to);

  if (error) {
    logSupabaseClientError("loadAdminCourses", error, { page: safePage });
    return { rows: [], page: safePage, pageSize: ADMIN_COURSE_PAGE_SIZE, totalCount: 0 };
  }

  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: row.status === "draft" ? "draft" as const : "published" as const,
    progressMode: row.progress_mode === "sequential" ? "sequential" as const : "open" as const,
    price: Number(row.price),
    listedInShop: Boolean(row.listed_in_shop),
  }));

  return {
    rows,
    page: safePage,
    pageSize: ADMIN_COURSE_PAGE_SIZE,
    totalCount: count ?? rows.length,
  };
}
