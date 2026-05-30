import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadAdminArticles } from "@/lib/blog/server/loadAdminArticles";

export async function loadPendingReviewArticles(
  supabase: SupabaseClient,
  locale: BlogLocale,
  page = 1,
  pageSize = 20,
) {
  return loadAdminArticles(supabase, {
    locale,
    page,
    pageSize,
    status: "pending_review",
  });
}
