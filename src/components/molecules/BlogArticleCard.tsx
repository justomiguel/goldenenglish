import Link from "next/link";
import type { BlogArticleListItem } from "@/lib/blog/server";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { PublicContentCoverThumb } from "@/components/molecules/PublicContentCoverThumb";

interface BlogArticleCardProps {
  locale: string;
  article: BlogArticleListItem;
  readMoreLabel: string;
}

export function BlogArticleCard({ locale, article, readMoreLabel }: BlogArticleCardProps) {
  if (!article.translation) return null;
  const coverImageUrl = resolveBlogCoverImageUrl(
    article.translation.bodyHtml,
    article.coverStoragePath,
  );
  return (
    <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex gap-3">
        {coverImageUrl ? (
          <PublicContentCoverThumb src={coverImageUrl} alt={article.translation.title} />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
            {article.translation.title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {article.translation.excerpt}
          </p>
          <Link
            href={`/${locale}/blog/${article.translation.slug}`}
            className="mt-3 inline-flex text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {readMoreLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
