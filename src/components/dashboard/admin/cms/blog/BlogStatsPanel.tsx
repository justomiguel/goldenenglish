interface BlogStatsPanelProps {
  locale: string;
  reading: number;
  listToArticle: number | null;
  ctaRate: number | null;
  commentRate: number | null;
  rows: Array<{
    articleId: string;
    title: string;
    reading: number;
    ctaRate: number | null;
    commentRate: number | null;
  }>;
  labels: {
    reading: string;
    listToArticle: string;
    ctaRate: string;
    commentRate: string;
    empty: string;
    emDash: string;
  };
}

function formatRate(locale: string, value: number | null, empty: string): string {
  if (value === null) return empty;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function BlogStatsPanel({
  locale,
  reading,
  listToArticle,
  ctaRate,
  commentRate,
  rows,
  labels,
}: BlogStatsPanelProps) {
  return (
    <section className="grid gap-6">
      <p className="text-3xl font-semibold text-[var(--color-foreground)]">
        {reading.toLocaleString(locale)}
        <span className="ml-2 text-base font-normal text-[var(--color-muted-foreground)]">
          {labels.reading}
        </span>
      </p>
      <dl className="grid gap-2 text-sm text-[var(--color-foreground)]">
        <div className="flex justify-between gap-4">
          <dt>{labels.listToArticle}</dt>
          <dd>{formatRate(locale, listToArticle, labels.emDash)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{labels.ctaRate}</dt>
          <dd>{formatRate(locale, ctaRate, labels.emDash)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{labels.commentRate}</dt>
          <dd>{formatRate(locale, commentRate, labels.emDash)}</dd>
        </div>
      </dl>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[var(--color-muted-foreground)]">
              <th className="py-2 font-medium">{labels.reading}</th>
              <th className="py-2 font-medium">{labels.ctaRate}</th>
              <th className="py-2 font-medium">{labels.commentRate}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.articleId} className="border-t border-[var(--color-border)]">
                <th className="py-2 font-medium text-[var(--color-foreground)]">{row.title}</th>
                <td>{row.reading.toLocaleString(locale)}</td>
                <td>{formatRate(locale, row.ctaRate, labels.emDash)}</td>
                <td>{formatRate(locale, row.commentRate, labels.emDash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
