import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import {
  mapArticleRow,
  pickTranslationForLocale,
  type BlogArticleRowFromDb,
  type BlogTranslationRowFromDb,
} from "@/lib/blog/server/types";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

export async function loadArticleBySlug(
  supabase: SupabaseClient,
  locale: BlogLocale,
  slug: string,
): Promise<{
  article: ReturnType<typeof mapArticleRow> | null;
  translation: ReturnType<typeof pickTranslationForLocale>;
}> {
  const { data: translation, error: translationError } = await supabase
    .from("blog_article_translations")
    .select(
      "article_id, locale, slug, title, excerpt, body_html, body_text_plain, reading_time_minutes, seo_title, seo_description, attachments",
    )
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();

  if (translationError) {
    logSupabaseError("loadArticleBySlug:translation", translationError, { locale, slug });
    return { article: null, translation: null };
  }
  if (!translation?.article_id) return { article: null, translation: null };

  const { data: articleData, error: articleError } = await supabase
    .from("blog_articles")
    .select(
      "id, default_locale, status, published_at, scheduled_for, cover_storage_path, tags, is_pinned, pinned_at, comments_enabled, author_id, view_count, created_at, updated_at, updated_by",
    )
    .eq("id", translation.article_id)
    .maybeSingle();

  if (articleError) {
    logSupabaseError("loadArticleBySlug:article", articleError, { locale, slug });
    return { article: null, translation: null };
  }

  if (!articleData) return { article: null, translation: null };
  const article = mapArticleRow(articleData as BlogArticleRowFromDb);
  const translationRows = [translation as BlogTranslationRowFromDb];
  const picked = pickTranslationForLocale(
    translationRows,
    article.id,
    locale,
    article.defaultLocale,
  );
  return { article, translation: picked };
}
