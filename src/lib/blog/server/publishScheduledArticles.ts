import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function publishScheduledArticles(
  supabase: SupabaseClient,
): Promise<{ ok: boolean; publishedCount: number }> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_articles")
    .update({ status: "published", published_at: nowIso })
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .select("id");

  if (error) {
    logSupabaseClientError("blog.publish_scheduled", error);
    return { ok: false, publishedCount: 0 };
  }

  return {
    ok: true,
    publishedCount: (data ?? []).length,
  };
}
