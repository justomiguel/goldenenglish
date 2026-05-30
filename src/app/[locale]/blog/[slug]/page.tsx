import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  incrementArticleViewCount,
  loadArticleBySlug,
  loadRelatedArticles,
} from "@/lib/blog/server";
import { BlogArticleDetailSurfaceEntry } from "@/components/organisms/BlogArticleDetailSurfaceEntry";
import { JsonLdArticle } from "@/components/molecules/JsonLdArticle";
import { BlogArticleCard } from "@/components/molecules/BlogArticleCard";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { buildPublicShareMetadata } from "@/lib/site/buildPublicShareMetadata";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { BlogCommentsSection } from "@/components/organisms/BlogCommentsSection";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createClient();
  const { article, translation } = await loadArticleBySlug(supabase, locale as "en" | "es" | "pt", slug);
  if (!article || !translation) return {};
  const title = translation.seoTitle ?? translation.title;
  const description = translation.seoDescription ?? translation.excerpt;
  const brand = await getBrandForRequest();
  const coverImageUrl = resolveBlogCoverImageUrl(
    translation.bodyHtml,
    article.coverStoragePath,
  );
  const share = buildPublicShareMetadata({
    title,
    description,
    path: `/${locale}/blog/${translation.slug}`,
    coverImageUrl,
    fallbackImageUrl: brand.logoPath,
    ogType: "article",
  });
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/blog/${translation.slug}`,
    },
    ...share,
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const detailLabels = dict.blog.detail;
  const listLabels = dict.blog.list;
  const commentLabels = dict.blog.comments;
  const supabase = await createClient();
  const { article, translation } = await loadArticleBySlug(
    supabase,
    locale as "en" | "es" | "pt",
    slug,
  );
  if (!article || !translation) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await incrementArticleViewCount(supabase, {
    articleId: article.id,
    entity: "section:blog",
    userId: user?.id ?? null,
    sessionKey: `${locale}:${translation.slug}`,
  });

  const related = await loadRelatedArticles(supabase, {
    articleId: article.id,
    tags: article.tags,
    locale: locale as "en" | "es" | "pt",
    limit: 3,
  });
  const publicUrl = getPublicSiteUrl();
  const coverImageUrl = resolveBlogCoverImageUrl(
    translation.bodyHtml,
    article.coverStoragePath,
  );

  return (
    <div className="space-y-8">
      <BlogArticleDetailSurfaceEntry
        title={translation.title}
        excerpt={translation.excerpt}
        bodyHtml={translation.bodyHtml}
        attachments={translation.attachments}
        attachmentsTitle={detailLabels.attachmentsTitle}
        shareUrl={`${publicUrl}/${locale}/blog/${translation.slug}`}
        shareLabel={detailLabels.share}
      />

      <JsonLdArticle
        url={`${publicUrl}/${locale}/blog/${translation.slug}`}
        title={translation.title}
        description={translation.excerpt}
        publishedAt={article.publishedAt ?? article.createdAt}
        imageUrl={coverImageUrl}
      />

      {related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--color-secondary)]">
            {detailLabels.relatedTitle}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <BlogArticleCard
                key={item.id}
                locale={locale}
                article={item}
                readMoreLabel={listLabels.readMore}
              />
            ))}
          </div>
        </section>
      ) : null}

      {article.commentsEnabled ? (
        <BlogCommentsSection
          articleId={article.id}
          canComment={Boolean(user)}
          signInHref={`/${locale}/login`}
          signInLabel={dict.nav.login}
          labels={commentLabels}
        />
      ) : null}
    </div>
  );
}
