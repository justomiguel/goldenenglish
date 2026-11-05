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

  await logSupabaseClientError("blog.increment_view.rpc", error, { articleId });
  return false;
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
