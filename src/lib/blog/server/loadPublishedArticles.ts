import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { buildSimpleTsQuery } from "@/lib/blog/searchTokenize";
import {
  mapArticleRow,
  pickTranslationForLocale,
  type BlogArticleRowFromDb,
  type BlogTranslationRowFromDb,
  type PaginatedBlogArticles,
} from "@/lib/blog/server/types";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

interface LoadPublishedArticlesInput {
  locale: BlogLocale;
  page: number;
  pageSize: number;
  tag?: string;
  query?: string;
}

export async function loadPublishedArticles(
  supabase: SupabaseClient,
  input: LoadPublishedArticlesInput,
): Promise<PaginatedBlogArticles> {
  const page = Math.max(1, input.page);
  const pageSize = Math.min(50, Math.max(1, input.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("blog_articles")
    .select(
      "id, default_locale, status, published_at, scheduled_for, cover_storage_path, tags, is_pinned, pinned_at, comments_enabled, author_id, view_count, created_at, updated_at, updated_by",
      { count: "exact" },
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (input.tag) {
    query = query.contains("tags", [input.tag]);
  }

  const tsQuery = buildSimpleTsQuery(input.query ?? "");
  if (tsQuery.length > 0) {
    const { data: translationIds, error: translationError } = await supabase
      .from("blog_article_translations")
      .select("article_id")
      .eq("locale", input.locale)
      .textSearch("tsv", tsQuery, { config: "simple", type: "websearch" });
    if (translationError) {
      logSupabaseError("loadPublishedArticles:textSearch", translationError, {
        locale: input.locale,
      });
      return { rows: [], total: 0, truncated: false };
    }
    const matchingIds = Array.from(new Set((translationIds ?? []).map((row) => row.article_id)));
    if (matchingIds.length === 0) {
      return { rows: [], total: 0, truncated: false };
    }
    query = query.in("id", matchingIds);
  }

  const { data, error, count } = await query;
  if (error) {
    logSupabaseError("loadPublishedArticles", error, {
      page,
      pageSize,
      locale: input.locale,
    });
    return { rows: [], total: 0, truncated: false };
  }

  const articleRows = (data ?? []) as BlogArticleRowFromDb[];
  const articleIds = articleRows.map((row) => row.id);
  if (articleIds.length === 0) {
    return { rows: [], total: count ?? 0, truncated: false };
  }

  const { data: translations, error: translationError } = await supabase
    .from("blog_article_translations")
    .select(
      "article_id, locale, slug, title, excerpt, body_html, body_text_plain, reading_time_minutes, seo_title, seo_description, attachments",
    )
    .in("article_id", articleIds);

  if (translationError) {
    logSupabaseError("loadPublishedArticles:translations", translationError, {
      locale: input.locale,
    });
    return { rows: [], total: count ?? 0, truncated: false };
  }

  const translationRows = (translations ?? []) as BlogTranslationRowFromDb[];
  const rows = articleRows.map((row) => {
    const article = mapArticleRow(row);
    const translation = pickTranslationForLocale(
      translationRows,
      row.id,
      input.locale,
      article.defaultLocale,
    );
    return { ...article, translation };
  });

  const total = count ?? rows.length;
  return {
    rows,
    total,
    truncated: total > rows.length && page === 1,
  };
}
