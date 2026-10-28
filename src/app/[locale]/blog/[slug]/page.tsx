import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  buildContentViewSessionKey,
  getContentViewViewerSessionId,
} from "@/lib/analytics/server/contentViewSession";
import {
  incrementArticleViewCount,
  loadArticleBySlug,
  loadRelatedArticles,
} from "@/lib/blog/server";
import type { BlogLocale } from "@/lib/blog/domain";
import {
  buildBlogArticleLanguageAlternates,
  buildBlogArticleLocalePaths,
} from "@/lib/blog/buildBlogArticleLocalePaths";
import { BlogArticleLocaleHrefProvider } from "@/components/blog/BlogArticleLocaleHrefProvider";
import { pickBlogRichContentLabels } from "@/lib/blog/pickBlogRichContentLabels";
import { BlogArticleDetailSurfaceEntry } from "@/components/organisms/BlogArticleDetailSurfaceEntry";
import { JsonLdArticle } from "@/components/molecules/JsonLdArticle";
import { BlogArticleRelatedInline } from "@/components/molecules/BlogArticleRelatedInline";
import { getBrandForRequest } from "@/lib/brand/server";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { buildPublicShareMetadata } from "@/lib/site/buildPublicShareMetadata";
import { resolveInstituteOpenGraphLocale } from "@/lib/site/buildResolvedPublicShareMetadata";
import { buildPublicShareTitle, clipShareDescription } from "@/lib/site/publicShareText";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { stripFirstImageFromHtml } from "@/lib/rich-content/stripFirstImageFromHtml";
import { BlogCommentsSection } from "@/components/organisms/BlogCommentsSection";
import {
  formatBlogArticleListDate,
  formatBlogArticleViewCountLabel,
  resolveBlogArticleListIsoDate,
} from "@/lib/blog/formatBlogArticleListDate";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const blogLocale = locale as BlogLocale;
  const supabase = await createClient();
  const { article, translation, localeSlugs } = await loadArticleBySlug(
    supabase,
    blogLocale,
    slug,
  );
  if (!article || !translation) return {};
  const brand = await getBrandForRequest();
  const title = translation.seoTitle ?? translation.title;
  const description = clipShareDescription(translation.seoDescription ?? translation.excerpt);
  const shareTitle = buildPublicShareTitle(translation.title, brand.name);
  const path = `/${locale}/blog/${translation.slug}`;
  const share = await buildPublicShareMetadata({
    title: shareTitle,
    description,
    path,
    deferShareImageToFileMetadata: true,
    ogType: "article",
    locale: await resolveInstituteOpenGraphLocale(path),
  });
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: buildBlogArticleLanguageAlternates(localeSlugs, article.defaultLocale),
    },
    ...share,
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const blogLocale = locale as BlogLocale;
  const dict = await getDictionary(locale);
  const detailLabels = dict.blog.detail;
  const listLabels = dict.blog.list;
  const commentLabels = dict.blog.comments;
  const supabase = await createClient();
  const { article, translation, localeSlugs } = await loadArticleBySlug(
    supabase,
    blogLocale,
    slug,
  );
  if (!article || !translation) notFound();

  if (translation.slug !== slug) {
    redirect(`/${locale}/blog/${translation.slug}`);
  }

  const localeHrefMap = buildBlogArticleLocalePaths(localeSlugs);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerSessionId = await getContentViewViewerSessionId();
  const viewIncrement = await incrementArticleViewCount(supabase, {
    articleId: article.id,
    entity: "section:blog",
    userId: user?.id ?? null,
    sessionKey: buildContentViewSessionKey(locale, translation.slug, viewerSessionId),
  });
  const displayViewCount =
    viewIncrement.ok && !viewIncrement.deduped ? article.viewCount + 1 : article.viewCount;
  const displayDateIso = resolveBlogArticleListIsoDate(article);
  const displayDate = formatBlogArticleListDate(article, locale);
  const viewsLabel = formatBlogArticleViewCountLabel(
    displayViewCount,
    locale,
    listLabels.viewsCount,
  );

  const related = await loadRelatedArticles(supabase, {
    articleId: article.id,
    tags: article.tags,
    locale: blogLocale,
    limit: 3,
  });
  const [publicUrl, { url: supabaseUrl }] = await Promise.all([
    getRequestPublicSiteUrl(),
    readRequestSupabasePublicEnv(),
  ]);
  const coverImageUrl = resolveBlogCoverImageUrl(
    translation.bodyHtml,
    article.coverStoragePath,
    supabaseUrl,
  );
  const coverUnoptimized =
    coverImageUrl?.startsWith("/images/") || coverImageUrl?.startsWith("data:");
  const bodyHtml = coverImageUrl
    ? stripFirstImageFromHtml(translation.bodyHtml)
    : translation.bodyHtml;
  const richContentLabels = pickBlogRichContentLabels(dict);
  const attachments = supabaseUrl
    ? translation.attachments.map((item) =>
        item.kind === "file"
          ? { ...item, storagePath: blogMediaPublicUrl(supabaseUrl, item.storagePath) }
          : item,
      )
    : translation.attachments;

  return (
    <BlogArticleLocaleHrefProvider hrefs={localeHrefMap}>
      <div className="space-y-8">
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
          richContentLabels={richContentLabels}
          shareUrl={`${publicUrl}/${locale}/blog/${translation.slug}`}
          shareLabel={detailLabels.share}
          shareCopiedLabel={detailLabels.shareCopied}
        />

        <JsonLdArticle
          url={`${publicUrl}/${locale}/blog/${translation.slug}`}
          title={translation.title}
          description={translation.excerpt}
          publishedAt={article.publishedAt ?? article.createdAt}
          imageUrl={coverImageUrl}
        />

        {related.length > 0 ? (
          <BlogArticleRelatedInline
            locale={locale}
            articles={related}
            title={detailLabels.relatedTitle}
          />
        ) : null}

        {user && article.commentsEnabled ? (
          <BlogCommentsSection articleId={article.id} labels={commentLabels} />
        ) : null}
      </div>
    </BlogArticleLocaleHrefProvider>
  );
}
