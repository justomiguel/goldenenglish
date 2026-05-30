import { z } from "zod";
import { blogAttachmentsSchema } from "@/lib/blog/attachments";
import { BLOG_ARTICLE_STATUSES, BLOG_LOCALES } from "@/lib/blog/domain";

export const blogLocaleSchema = z.enum(BLOG_LOCALES);
export const blogArticleStatusSchema = z.enum(BLOG_ARTICLE_STATUSES);

export const articleTranslationInputSchema = z.object({
  locale: blogLocaleSchema,
  slug: z.string().min(1).max(140),
  title: z.string().min(1).max(180),
  excerpt: z.string().max(280),
  bodyHtml: z.string().min(1),
  attachments: blogAttachmentsSchema.optional().default([]),
  seoTitle: z.string().max(180).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
});

export const articleCreateInputSchema = z.object({
  defaultLocale: blogLocaleSchema,
  status: blogArticleStatusSchema.default("draft"),
  tags: z.array(z.string()).max(30).default([]),
  coverStoragePath: z.string().nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  commentsEnabled: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  translations: z.array(articleTranslationInputSchema).min(1),
});

export const articleSearchSchema = z.object({
  query: z.string().max(200).default(""),
  locale: blogLocaleSchema,
  tag: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const commentCreateSchema = z.object({
  articleId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable().optional(),
  bodyText: z.string().min(1).max(2000),
});
