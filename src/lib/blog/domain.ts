import type { BlogVisibility } from "@/lib/blog/articleVisibility";
import type { BlogAttachment } from "@/lib/blog/attachments";

export const BLOG_LOCALES = ["en", "es", "pt"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const BLOG_ARTICLE_STATUSES = [
  "draft",
  "pending_review",
  "scheduled",
  "published",
  "archived",
] as const;
export type BlogArticleStatus = (typeof BLOG_ARTICLE_STATUSES)[number];

export const BLOG_COMMENT_STATUSES = ["visible", "hidden", "flagged", "pending"] as const;
export type BlogCommentStatus = (typeof BLOG_COMMENT_STATUSES)[number];

export interface BlogArticle {
  id: string;
  defaultLocale: BlogLocale;
  status: BlogArticleStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  coverStoragePath: string | null;
  tags: string[];
  isPinned: boolean;
  pinnedAt: string | null;
  commentsEnabled: boolean;
  visibility: BlogVisibility;
  authorId: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface BlogArticleTranslation {
  articleId: string;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  bodyTextPlain: string;
  readingTimeMinutes: number;
  attachments: BlogAttachment[];
  seoTitle: string | null;
  seoDescription: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

export interface BlogArticleComment {
  id: string;
  articleId: string;
  authorId: string | null;
  guestDisplayName: string | null;
  parentCommentId: string | null;
  bodyText: string;
  status: BlogCommentStatus;
  createdAt: string;
  updatedAt: string;
}
