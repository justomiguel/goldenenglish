import type { SectionCollectionsKpis } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { SectionCollectionsHealthBadge } from "./SectionCollectionsHealthBadge";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}

interface KpiBlockProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "default" | "warning" | "error" | "success";
}

function KpiBlock({ label, value, hint, emphasis = "default" }: KpiBlockProps) {
  const accent =
    emphasis === "warning"
      ? "text-[var(--color-warning)]"
      : emphasis === "error"
        ? "text-[var(--color-error)]"
        : emphasis === "success"
          ? "text-[var(--color-success)]"
          : "text-[var(--color-foreground)]";
  return (
    <div className="flex flex-col gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className={`text-base font-semibold ${accent}`}>{value}</span>
      {hint ? (
        <span className="text-[11px] text-[var(--color-muted-foreground)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface SectionCollectionsKpisCardProps {
  kpis: SectionCollectionsKpis;
  dict: CollectionsDict;
  locale: string;
  currency?: string;
}

export function SectionCollectionsKpisCard({
  kpis,
  dict,
  locale,
  currency = "USD",
}: SectionCollectionsKpisCardProps) {
  const k = dict.kpis;
  return (
    <section
      aria-label={dict.title}
      className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {dict.title}
        </h2>
        <SectionCollectionsHealthBadge health={kpis.health} dict={dict} />
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiBlock
          label={k.expectedYear}
          value={formatMoney(kpis.expectedYear, locale, currency)}
        />
        <KpiBlock
          label={k.paid}
          value={formatMoney(kpis.paid, locale, currency)}
          emphasis="success"
        />
        <KpiBlock
          label={k.pendingReview}
          value={formatMoney(kpis.pendingReview, locale, currency)}
          emphasis="warning"
        />
        <KpiBlock
          label={k.overdue}
          value={formatMoney(kpis.overdue, locale, currency)}
          emphasis="error"
        />
        <KpiBlock
          label={k.collectionRatio}
          value={formatPercent(kpis.collectionRatio, locale)}
        />
        <KpiBlock
          label={k.students}
          value={String(kpis.totalStudents)}
          hint={`${k.overdueStudents}: ${kpis.overdueStudents}`}
        />
      </div>
    </section>
  );
}
