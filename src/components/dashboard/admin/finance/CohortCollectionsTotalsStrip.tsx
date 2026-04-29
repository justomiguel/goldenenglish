import type { SectionCollectionsKpis } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";

type OverviewDict = Dictionary["admin"]["finance"]["overview"];

function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}

function TotalTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`text-sm font-semibold tabular-nums ${accent ?? "text-[var(--color-foreground)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

export interface CohortCollectionsTotalsStripProps {
  totals: SectionCollectionsKpis;
  overviewDict: OverviewDict;
  locale: string;
  currency: string;
}

export function CohortCollectionsTotalsStrip({
  totals,
  overviewDict,
  locale,
  currency,
}: CohortCollectionsTotalsStripProps) {
  return (
    <section
      aria-labelledby="cohort-totals"
      className="grid grid-cols-2 gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-4"
    >
      <h2 id="cohort-totals" className="sr-only">
        {overviewDict.totals.title}
      </h2>
      <TotalTile
        label={overviewDict.totals.expectedYear}
        value={formatMoney(totals.expectedYear, locale, currency)}
      />
      <TotalTile
        label={overviewDict.totals.collected}
        value={formatMoney(totals.paid, locale, currency)}
        accent="text-[var(--color-success)]"
      />
      <TotalTile
        label={overviewDict.totals.overdue}
        value={formatMoney(totals.overdue, locale, currency)}
        accent="text-[var(--color-error)]"
      />
      <TotalTile
        label={overviewDict.totals.ratio}
        value={formatPercent(totals.collectionRatio, locale)}
      />
    </section>
  );
}
