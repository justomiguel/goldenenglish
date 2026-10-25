import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBlogAttachmentsFromDb } from "@/lib/blog/attachments";
import { pickBlogRichContentLabels } from "@/lib/blog/pickBlogRichContentLabels";
import { verifyBlogPreviewToken } from "@/lib/blog/previewToken";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { buildBlogPreviewPath } from "@/lib/site/publicSharePaths";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
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
  params: Promise<{ locale: string; slug: string; token: string }>;
}

export default async function BlogPreviewPage({ params }: PageProps) {
  noStore();

  const [{ locale, slug, token }, tenant] = await Promise.all([params, resolveRequestTenant()]);
  const dict = await getDictionary(locale);
  const detailLabels = dict.blog.detail;
  const listLabels = dict.blog.list;
  const payload = verifyBlogPreviewToken(token, tenant?.slug);
  if (!payload) notFound();

  const supabase = await createClient();
  const [{ data: translation }, { data: articleRow }] = await Promise.all([
    supabase
      .from("blog_article_translations")
      .select("title, excerpt, body_html, attachments, slug")
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
  const articleSlug = String(translation.slug ?? "").trim() || "articulo";
  const canonical = buildBlogPreviewPath(locale, articleSlug, token);
  if (`/${locale}/blog/vista-previa/${slug}/${token}` !== canonical) permanentRedirect(canonical);

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

  const { url: supabaseUrl } = await readRequestSupabasePublicEnv();
  const rawAttachments = parseBlogAttachmentsFromDb(translation.attachments);
  const attachments = supabaseUrl
    ? rawAttachments.map((item) =>
        item.kind === "file"
          ? { ...item, storagePath: blogMediaPublicUrl(supabaseUrl, item.storagePath) }
          : item,
      )
    : rawAttachments;

  return (
    <BlogArticleDetailSurfaceEntry
      locale={locale}
      title={translation.title}
      excerpt={translation.excerpt}
      bodyHtml={bodyHtml}
      coverImageUrl={coverImageUrl}
      coverUnoptimized={Boolean(coverUnoptimized)}
      attachments={attachments}
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
