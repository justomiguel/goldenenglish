import type { SupabaseClient } from "@supabase/supabase-js";
import { incrementContentViewCount } from "@/lib/analytics/server/incrementContentViewCount";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface IncrementArticleViewCountInput {
  articleId: string;
  entity: string;
  userId?: string | null;
  sessionKey?: string | null;
}

async function incrementBlogArticleStoredCount(
  supabase: SupabaseClient,
  articleId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("increment_blog_article_view_count", {
    p_article_id: articleId,
  });
  if (!error) return true;

  const { data: row, error: readError } = await supabase
    .from("blog_articles")
    .select("view_count")
    .eq("id", articleId);
  if (readError || !row?.[0]) {
    logSupabaseClientError("blog.increment_view.read", readError, { articleId });
    return false;
  }

  const fallback = await supabase
    .from("blog_articles")
    .update({ view_count: Number(row[0].view_count ?? 0) + 1 })
    .eq("id", articleId);
  if (fallback.error) {
    logSupabaseClientError("blog.increment_view.update", fallback.error, { articleId });
    return false;
  }

  return true;
}

export async function incrementArticleViewCount(
  supabase: SupabaseClient,
  input: IncrementArticleViewCountInput,
): Promise<{ ok: boolean; deduped: boolean }> {
  return incrementContentViewCount(supabase, {
    resourceId: input.articleId,
    entity: input.entity,
    kind: "article_view",
    userId: input.userId,
    sessionKey: input.sessionKey,
    logScope: "blog.increment_view",
    incrementStoredCount: (client) => incrementBlogArticleStoredCount(client, input.articleId),
  });
}
