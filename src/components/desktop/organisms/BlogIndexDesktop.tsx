import type { BlogArticleListItem } from "@/lib/blog/server";
import { BlogArticleCard, type BlogArticleCardLabels } from "@/components/molecules/BlogArticleCard";

interface BlogIndexDesktopProps {
  locale: string;
  rows: BlogArticleListItem[];
  labels: {
    title: string;
    empty: string;
  } & BlogArticleCardLabels;
}

export function BlogIndexDesktop({ locale, rows, labels }: BlogIndexDesktopProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <BlogArticleCard key={row.id} locale={locale} article={row} labels={labels} />
        ))}
      </div>
    </section>
  );
}
