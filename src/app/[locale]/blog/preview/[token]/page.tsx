import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBlogAttachmentsFromDb } from "@/lib/blog/attachments";
import { pickBlogRichContentLabels } from "@/lib/blog/pickBlogRichContentLabels";
import { verifyBlogPreviewToken } from "@/lib/blog/previewToken";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { stripFirstImageFromHtml } from "@/lib/rich-content/stripFirstImageFromHtml";
import { BlogArticleDetailSurfaceEntry } from "@/components/organisms/BlogArticleDetailSurfaceEntry";
import {
  formatBlogArticleListDate,
  formatBlogArticleViewCountLabel,
  resolveBlogArticleListIsoDate,
} from "@/lib/blog/formatBlogArticleListDate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function BlogPreviewPage({ params }: PageProps) {
  noStore();

  const { locale, token } = await params;
  const dict = await getDictionary(locale);
  const detailLabels = dict.blog.detail;
  const listLabels = dict.blog.list;
  const payload = verifyBlogPreviewToken(token);
  if (!payload) notFound();

  const supabase = await createClient();
  const [{ data: translation }, { data: articleRow }] = await Promise.all([
    supabase
      .from("blog_article_translations")
      .select("title, excerpt, body_html, attachments")
      .eq("article_id", payload.articleId)
      .eq("locale", locale)
      .maybeSingle(),
    supabase
      .from("blog_articles")
      .select("published_at, created_at, view_count")
      .eq("id", payload.articleId)
      .maybeSingle(),
  ]);
  if (!translation) notFound();

  const articleDates = {
    publishedAt: articleRow?.published_at ?? null,
    createdAt: articleRow?.created_at ?? new Date().toISOString(),
  };
  const displayDateIso = resolveBlogArticleListIsoDate(articleDates);
  const displayDate = formatBlogArticleListDate(articleDates, locale);
  const viewsLabel = formatBlogArticleViewCountLabel(
    Number(articleRow?.view_count ?? 0),
    locale,
    listLabels.viewsCount,
  );

  const bodyHtmlRaw = translation.body_html ?? "";
  const coverImageUrl = resolveBlogCoverImageUrl(bodyHtmlRaw, null);
  const coverUnoptimized =
    coverImageUrl?.startsWith("/images/") || coverImageUrl?.startsWith("data:");
  const bodyHtml = coverImageUrl ? stripFirstImageFromHtml(bodyHtmlRaw) : bodyHtmlRaw;

  return (
    <BlogArticleDetailSurfaceEntry
      locale={locale}
      title={translation.title}
      excerpt={translation.excerpt}
      bodyHtml={bodyHtml}
      coverImageUrl={coverImageUrl}
      coverUnoptimized={Boolean(coverUnoptimized)}
      attachments={parseBlogAttachmentsFromDb(translation.attachments)}
      attachmentsTitle={detailLabels.attachmentsTitle}
      heroLabels={{
        backToBlog: detailLabels.backToBlog,
        articleEyebrow: detailLabels.articleEyebrow,
        publishedDateAria: listLabels.publishedDateAria,
      }}
      displayDate={displayDate}
      displayDateIso={displayDateIso}
      viewsLabel={viewsLabel}
      richContentLabels={pickBlogRichContentLabels(dict)}
    />
  );
}
