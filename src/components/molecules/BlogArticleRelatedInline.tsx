import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogArticleListItem } from "@/lib/blog/server";

interface BlogArticleRelatedInlineProps {
  locale: string;
  articles: BlogArticleListItem[];
  title: string;
}

export function BlogArticleRelatedInline({
  locale,
  articles,
  title,
}: BlogArticleRelatedInlineProps) {
  const items = articles.filter((article) => article.translation?.slug);
  if (items.length === 0) return null;

  return (
    <section
      aria-label={title}
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3 md:px-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
          {title}
        </span>
        <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {items.map((article, index) => {
            const slug = article.translation!.slug;
            const itemTitle = article.translation!.title;
            return (
              <li key={article.id} className="inline-flex items-center gap-1">
                {index > 0 ? (
                  <span aria-hidden className="px-1 text-[var(--color-muted-foreground)]">
                    ·
                  </span>
                ) : null}
                <Link
                  href={`/${locale}/blog/${slug}`}
                  className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {itemTitle}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
