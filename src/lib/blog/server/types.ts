import { parseBlogAttachmentsFromDb } from "@/lib/blog/attachments";
import type { BlogArticle, BlogArticleComment, BlogArticleTranslation, BlogLocale } from "@/lib/blog/domain";

export interface BlogArticleListItem extends BlogArticle {
  translation: BlogArticleTranslation | null;
}

export interface PaginatedBlogArticles {
  rows: BlogArticleListItem[];
  total: number;
  truncated: boolean;
}

export interface PaginatedBlogComments {
  rows: BlogArticleComment[];
  total: number;
  truncated: boolean;
}

type TranslationRow = {
  article_id: string;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string;
  body_html: string;
  body_text_plain: string;
  reading_time_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  attachments?: unknown;
};

export function pickTranslationForLocale(
  rows: TranslationRow[],
  articleId: string,
  locale: BlogLocale,
  fallback: BlogLocale,
): BlogArticleTranslation | null {
  const localized = rows.find((row) => row.article_id === articleId && row.locale === locale);
  const selected =
    localized ??
    rows.find((row) => row.article_id === articleId && row.locale === fallback) ??
    rows.find((row) => row.article_id === articleId);
  if (!selected) return null;

  return {
    articleId: selected.article_id,
    locale: selected.locale,
    slug: selected.slug,
    title: selected.title,
    excerpt: selected.excerpt,
    bodyHtml: selected.body_html,
    bodyTextPlain: selected.body_text_plain,
    readingTimeMinutes: selected.reading_time_minutes,
    attachments: parseBlogAttachmentsFromDb(selected.attachments),
    seoTitle: selected.seo_title,
    seoDescription: selected.seo_description,
  };
}

export type BlogArticleRowFromDb = {
  id: string;
  default_locale: BlogLocale;
  status: BlogArticle["status"];
  published_at: string | null;
  scheduled_for: string | null;
  cover_storage_path: string | null;
  tags: string[] | null;
  is_pinned: boolean;
  pinned_at: string | null;
  comments_enabled: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export function mapArticleRow(row: BlogArticleRowFromDb): BlogArticle {
  return {
    id: row.id,
    defaultLocale: row.default_locale,
    status: row.status,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    coverStoragePath: row.cover_storage_path,
    tags: row.tags ?? [],
    isPinned: row.is_pinned,
    pinnedAt: row.pinned_at,
    commentsEnabled: row.comments_enabled,
    authorId: row.author_id,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export type BlogTranslationRowFromDb = TranslationRow;

export type BlogCommentRowFromDb = {
  id: string;
  article_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body_text: string;
  status: BlogArticleComment["status"];
  created_at: string;
  updated_at: string;
};

export function mapCommentRow(row: BlogCommentRowFromDb): BlogArticleComment {
  return {
    id: row.id,
    articleId: row.article_id,
    authorId: row.author_id,
    parentCommentId: row.parent_comment_id,
    bodyText: row.body_text,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
