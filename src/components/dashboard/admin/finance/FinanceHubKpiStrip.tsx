import type { SectionCollectionsKpis } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";

type KpiStripDict = Dictionary["admin"]["finance"]["collections"]["kpis"];

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

interface TileProps {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}

function Tile({ label, value, hint, accent }: TileProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${accent ?? "text-[var(--color-foreground)]"}`}>
        {value}
      </span>
      {hint ? (
        <span className="text-[10px] text-[var(--color-muted-foreground)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface FinanceHubKpiStripProps {
  kpis: SectionCollectionsKpis;
  dict: KpiStripDict;
  locale: string;
  currency?: string;
}

export function FinanceHubKpiStrip({
  kpis,
  dict,
  locale,
  currency = "USD",
}: FinanceHubKpiStripProps) {
  return (
    <section
      aria-label={dict.expectedYear}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
    >
      <Tile
        label={dict.expectedYear}
        value={formatMoney(kpis.expectedYear, locale, currency)}
      />
      <Tile
        label={dict.paid}
        value={formatMoney(kpis.paid, locale, currency)}
        accent="text-[var(--color-success)]"
      />
      <Tile
        label={dict.pendingReview}
        value={formatMoney(kpis.pendingReview, locale, currency)}
        accent="text-[var(--color-warning)]"
      />
      <Tile
        label={dict.overdue}
        value={formatMoney(kpis.overdue, locale, currency)}
        accent="text-[var(--color-error)]"
      />
      <Tile
        label={dict.upcoming}
        value={formatMoney(kpis.upcoming, locale, currency)}
      />
      <Tile
        label={dict.collectionRatio}
        value={formatPercent(kpis.collectionRatio, locale)}
      />
      <Tile
        label={dict.students}
        value={String(kpis.totalStudents)}
        hint={`${dict.overdueStudents}: ${kpis.overdueStudents}`}
      />
    </section>
  );
}
