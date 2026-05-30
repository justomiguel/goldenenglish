import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogArticleStatus, BlogLocale } from "@/lib/blog/domain";
import {
  mapArticleRow,
  pickTranslationForLocale,
  type BlogArticleRowFromDb,
  type BlogTranslationRowFromDb,
  type PaginatedBlogArticles,
} from "@/lib/blog/server/types";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

interface LoadAdminArticlesInput {
  locale: BlogLocale;
  page: number;
  pageSize: number;
  status?: BlogArticleStatus;
  authorId?: string;
  tag?: string;
}

export async function loadAdminArticles(
  supabase: SupabaseClient,
  input: LoadAdminArticlesInput,
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
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq("status", input.status);
  if (input.authorId) query = query.eq("author_id", input.authorId);
  if (input.tag) query = query.contains("tags", [input.tag]);

  const { data, error, count } = await query;
  if (error) {
    logSupabaseError("loadAdminArticles", error, { page, pageSize });
    return { rows: [], total: 0, truncated: false };
  }

  const articleRows = (data ?? []) as BlogArticleRowFromDb[];
  const ids = articleRows.map((row) => row.id);

  const translationRows: BlogTranslationRowFromDb[] =
    ids.length === 0
      ? []
      : (
          await supabase
            .from("blog_article_translations")
            .select(
              "article_id, locale, slug, title, excerpt, body_html, body_text_plain, reading_time_minutes, seo_title, seo_description, attachments",
            )
            .in("article_id", ids)
        ).data ?? [];

  const rows = articleRows.map((row) => {
    const article = mapArticleRow(row);
    return {
      ...article,
      translation: pickTranslationForLocale(
        translationRows as BlogTranslationRowFromDb[],
        row.id,
        input.locale,
        article.defaultLocale,
      ),
    };
  });

  const total = count ?? rows.length;
  return {
    rows,
    total,
    truncated: total > rows.length && page === 1,
  };
}
