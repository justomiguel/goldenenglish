import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { CohortCollectionsOverview } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { SectionCollectionsHealthBadge } from "./SectionCollectionsHealthBadge";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

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

interface SectionCardProps {
  href: string;
  name: string;
  totalStudents: number;
  overdueStudents: number;
  collectionRatio: number;
  paid: number;
  overdue: number;
  health: CohortCollectionsOverview["sections"][number]["kpis"]["health"];
  dict: CollectionsDict;
  locale: string;
  currency: string;
}

function SectionCard({
  href,
  name,
  totalStudents,
  overdueStudents,
  collectionRatio,
  paid,
  overdue,
  health,
  dict,
  locale,
  currency,
}: SectionCardProps) {
  return (
    <Link
      href={href}
      title={dict.overview.openTooltip}
      className="group flex flex-col gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]"
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-[var(--color-primary)] group-hover:underline">
          {name}
        </h3>
        <SectionCollectionsHealthBadge
          health={health}
          dict={dict}
          size="sm"
        />
      </header>
      <dl className="grid grid-cols-3 gap-2 text-[11px] text-[var(--color-muted-foreground)]">
        <div>
          <dt className="font-medium uppercase tracking-wide">
            {dict.kpis.collectionRatio}
          </dt>
          <dd className="text-sm font-semibold text-[var(--color-foreground)]">
            {formatPercent(collectionRatio, locale)}
          </dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide">
            {dict.kpis.paid}
          </dt>
          <dd className="text-sm font-semibold text-[var(--color-success)]">
            {formatMoney(paid, locale, currency)}
          </dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide">
            {dict.kpis.overdue}
          </dt>
          <dd className="text-sm font-semibold text-[var(--color-error)]">
            {formatMoney(overdue, locale, currency)}
          </dd>
        </div>
      </dl>
      <footer className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          <span>
            {totalStudents}
            {overdueStudents > 0 ? ` · ${overdueStudents} ⚠` : ""}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
          <span>{dict.openSection}</span>
          <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      </footer>
    </Link>
  );
}

export interface CohortCollectionsOverviewBoardProps {
  overview: CohortCollectionsOverview;
  dict: CollectionsDict;
  locale: string;
  baseHref: string;
  currency?: string;
}

export function CohortCollectionsOverviewBoard({
  overview,
  dict,
  locale,
  baseHref,
  currency = "USD",
}: CohortCollectionsOverviewBoardProps) {
  if (overview.sections.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {dict.overview.noSections}
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {overview.sections.map((s) => (
        <SectionCard
          key={s.sectionId}
          href={`${baseHref}/${s.sectionId}`}
          name={s.sectionName}
          totalStudents={s.kpis.totalStudents}
          overdueStudents={s.kpis.overdueStudents}
          collectionRatio={s.kpis.collectionRatio}
          paid={s.kpis.paid}
          overdue={s.kpis.overdue}
          health={s.kpis.health}
          dict={dict}
          locale={locale}
          currency={currency}
        />
      ))}
    </div>
  );
}
