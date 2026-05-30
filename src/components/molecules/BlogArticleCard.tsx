import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import type { BlogArticleListItem } from "@/lib/blog/server";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import {
  formatBlogArticleListDate,
  formatBlogArticleViewCountLabel,
  resolveBlogArticleListIsoDate,
} from "@/lib/blog/formatBlogArticleListDate";

export interface BlogArticleCardLabels {
  readMore: string;
  publishedDateAria: string;
  viewsCount: string;
}

interface BlogArticleCardProps {
  locale: string;
  article: BlogArticleListItem;
  labels: BlogArticleCardLabels;
}

export function BlogArticleCard({ locale, article, labels }: BlogArticleCardProps) {
  if (!article.translation) return null;

  const detailHref = `/${locale}/blog/${article.translation.slug}`;
  const coverImageUrl = resolveBlogCoverImageUrl(
    article.translation.bodyHtml,
    article.coverStoragePath,
  );
  const coverUnoptimized =
    coverImageUrl?.startsWith("/images/") || coverImageUrl?.startsWith("data:");
  const displayDateIso = resolveBlogArticleListIsoDate(article);
  const displayDate = formatBlogArticleListDate(article, locale);
  const viewsLabel = formatBlogArticleViewCountLabel(
    article.viewCount,
    locale,
    labels.viewsCount,
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={detailHref}
        className="relative block aspect-[16/9] w-full shrink-0 bg-[var(--color-muted)]"
      >
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={article.translation.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={coverUnoptimized}
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
          {displayDate ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <time dateTime={displayDateIso} aria-label={labels.publishedDateAria}>
                {displayDate}
              </time>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {viewsLabel}
          </span>
        </div>

        <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--color-foreground)]">
          <Link href={detailHref} className="hover:text-[var(--color-primary)] hover:underline">
            {article.translation.title}
          </Link>
        </h3>

        {article.translation.excerpt ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {article.translation.excerpt}
          </p>
        ) : null}

        <Link
          href={detailHref}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          {labels.readMore}
        </Link>
      </div>
    </article>
  );
}
