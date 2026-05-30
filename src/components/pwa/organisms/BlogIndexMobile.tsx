import type { BlogArticleListItem } from "@/lib/blog/server";
import { BlogArticleCard } from "@/components/molecules/BlogArticleCard";

interface BlogIndexMobileProps {
  locale: string;
  rows: BlogArticleListItem[];
  labels: {
    title: string;
    empty: string;
    readMore: string;
  };
}

export function BlogIndexMobile({ locale, rows, labels }: BlogIndexMobileProps) {
  return (
    <section className="space-y-3 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : null}
      <div className="grid gap-3">
        {rows.map((row) => (
          <BlogArticleCard key={row.id} locale={locale} article={row} readMoreLabel={labels.readMore} />
        ))}
      </div>
    </section>
  );
}
