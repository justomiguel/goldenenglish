import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

interface BlogArticleDetailHeroProps {
  locale: string;
  title: string;
  coverImageUrl: string | null;
  coverUnoptimized: boolean;
  displayDate: string;
  displayDateIso: string;
  viewsLabel: string;
  labels: {
    backToBlog: string;
    articleEyebrow: string;
    publishedDateAria: string;
  };
}

export function BlogArticleDetailHero({
  locale,
  title,
  coverImageUrl,
  coverUnoptimized,
  displayDate,
  displayDateIso,
  viewsLabel,
  labels,
}: BlogArticleDetailHeroProps) {
  const blogHref = `/${locale}/blog`;

  return (
    <header className="space-y-6">
      <Link
        href={blogHref}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {labels.backToBlog}
      </Link>

      {coverImageUrl ? (
        <figure className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 shadow-sm">
          <Image
            src={coverImageUrl}
            alt=""
            width={1600}
            height={900}
            className="mx-auto h-auto max-h-[min(65dvh,560px)] w-full object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 768px"
            priority
            unoptimized={coverUnoptimized}
          />
        </figure>
      ) : null}

      <div
        className={
          coverImageUrl
            ? "border-b border-[var(--color-border)] pb-6"
            : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8"
        }
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
          {labels.articleEyebrow}
        </p>

        {(displayDate || viewsLabel) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
            {displayDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                <time dateTime={displayDateIso} aria-label={labels.publishedDateAria}>
                  {displayDate}
                </time>
              </span>
            ) : null}
            {viewsLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 shrink-0" aria-hidden />
                {viewsLabel}
              </span>
            ) : null}
          </div>
        )}

        <h1 className="mt-3 max-w-3xl text-balance text-2xl font-bold leading-tight tracking-tight text-[var(--color-secondary)] md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
          {title}
        </h1>
      </div>
    </header>
  );
}
