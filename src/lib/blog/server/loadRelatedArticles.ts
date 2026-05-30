import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import {
  mapArticleRow,
  pickTranslationForLocale,
  type BlogArticleListItem,
  type BlogArticleRowFromDb,
  type BlogTranslationRowFromDb,
} from "@/lib/blog/server/types";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

export async function loadRelatedArticles(
  supabase: SupabaseClient,
  input: {
    articleId: string;
    tags: string[];
    locale: BlogLocale;
    limit?: number;
  },
): Promise<BlogArticleListItem[]> {
  const limit = Math.max(1, Math.min(6, input.limit ?? 3));

  let query = supabase
    .from("blog_articles")
    .select(
      "id, default_locale, status, published_at, scheduled_for, cover_storage_path, tags, is_pinned, pinned_at, comments_enabled, author_id, view_count, created_at, updated_at, updated_by",
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .neq("id", input.articleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (input.tags.length > 0) {
    query = query.overlaps("tags", input.tags);
  }

  const { data, error } = await query;
  if (error) {
    logSupabaseError("loadRelatedArticles", error, { articleId: input.articleId });
    return [];
  }

  const articleRows = (data ?? []) as BlogArticleRowFromDb[];
  const ids = articleRows.map((row) => row.id);
  if (ids.length === 0) return [];

  const { data: translations, error: translationError } = await supabase
    .from("blog_article_translations")
    .select(
      "article_id, locale, slug, title, excerpt, body_html, body_text_plain, reading_time_minutes, seo_title, seo_description, attachments",
    )
    .in("article_id", ids);

  if (translationError) {
    logSupabaseError("loadRelatedArticles:translations", translationError);
    return [];
  }

  const translationRows = (translations ?? []) as BlogTranslationRowFromDb[];
  return articleRows.map((row) => {
    const article = mapArticleRow(row);
    return {
      ...article,
      translation: pickTranslationForLocale(
        translationRows,
        row.id,
        input.locale,
        article.defaultLocale,
      ),
    };
  });
}
