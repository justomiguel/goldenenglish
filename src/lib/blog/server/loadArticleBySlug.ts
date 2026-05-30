import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { resolveArticleIdFromSlugMatches } from "@/lib/blog/resolveArticleIdFromSlugMatches";
import {
  mapArticleRow,
  pickTranslationForLocale,
  type BlogArticleRowFromDb,
  type BlogTranslationRowFromDb,
} from "@/lib/blog/server/types";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

const TRANSLATION_COLUMNS =
  "article_id, locale, slug, title, excerpt, body_html, body_text_plain, reading_time_minutes, seo_title, seo_description, attachments";

const ARTICLE_COLUMNS =
  "id, default_locale, status, published_at, scheduled_for, cover_storage_path, tags, is_pinned, pinned_at, comments_enabled, author_id, view_count, created_at, updated_at, updated_by";

export type BlogArticleBySlugResult = {
  article: ReturnType<typeof mapArticleRow> | null;
  translation: ReturnType<typeof pickTranslationForLocale>;
  localeSlugs: Partial<Record<BlogLocale, string>>;
};

export async function loadArticleBySlug(
  supabase: SupabaseClient,
  locale: BlogLocale,
  slug: string,
): Promise<BlogArticleBySlugResult> {
  const empty: BlogArticleBySlugResult = {
    article: null,
    translation: null,
    localeSlugs: {},
  };

  const { data: exactTranslation, error: exactError } = await supabase
    .from("blog_article_translations")
    .select("article_id")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();

  if (exactError) {
    logSupabaseError("loadArticleBySlug:translation", exactError, { locale, slug });
    return empty;
  }

  let articleId = exactTranslation?.article_id ?? null;

  if (!articleId) {
    const { data: slugMatches, error: slugMatchError } = await supabase
      .from("blog_article_translations")
      .select("article_id, locale")
      .eq("slug", slug);

    if (slugMatchError) {
      logSupabaseError("loadArticleBySlug:slug_match", slugMatchError, { locale, slug });
      return empty;
    }

    articleId = resolveArticleIdFromSlugMatches(
      (slugMatches ?? []) as { article_id: string; locale: BlogLocale }[],
      locale,
    );
  }

  if (!articleId) return empty;

  const [{ data: articleData, error: articleError }, { data: translationRows, error: rowsError }] =
    await Promise.all([
      supabase.from("blog_articles").select(ARTICLE_COLUMNS).eq("id", articleId).maybeSingle(),
      supabase
        .from("blog_article_translations")
        .select(TRANSLATION_COLUMNS)
        .eq("article_id", articleId),
    ]);

  if (articleError) {
    logSupabaseError("loadArticleBySlug:article", articleError, { locale, slug, articleId });
    return empty;
  }
  if (rowsError) {
    logSupabaseError("loadArticleBySlug:translations", rowsError, { locale, slug, articleId });
    return empty;
  }

  if (!articleData) return empty;

  const article = mapArticleRow(articleData as BlogArticleRowFromDb);
  const rows = (translationRows ?? []) as BlogTranslationRowFromDb[];
  const localeSlugs = Object.fromEntries(
    rows.map((row) => [row.locale, row.slug]),
  ) as Partial<Record<BlogLocale, string>>;

  const picked = pickTranslationForLocale(rows, article.id, locale, article.defaultLocale);
  if (!picked || picked.locale !== locale) {
    return { article: null, translation: null, localeSlugs: {} };
  }

  return { article, translation: picked, localeSlugs };
}
