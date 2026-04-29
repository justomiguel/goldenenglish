"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { FinanceProjection } from "@/types/financeAnalytics";
import type { Dictionary } from "@/types/i18n";

type ProjDict = Dictionary["admin"]["finance"]["insights"]["projection"];

export interface FinanceProjectionCardProps {
  projection: FinanceProjection;
  locale: string;
  labels: ProjDict;
}

function fmtCurrency(n: number, locale: string): string {
  return Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type Outlook = "onTrack" | "slightlyBehind" | "significantlyBehind";

function deriveOutlook(gapPercent: number): Outlook {
  if (gapPercent >= -0.05) return "onTrack";
  if (gapPercent >= -0.15) return "slightlyBehind";
  return "significantlyBehind";
}

const OUTLOOK_STYLES: Record<Outlook, string> = {
  onTrack:
    "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)]",
  slightlyBehind:
    "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)]",
  significantlyBehind:
    "border-[var(--color-error)]/30 bg-[var(--color-error)]/5 text-[var(--color-error)]",
};

export function FinanceProjectionCard({
  projection,
  locale,
  labels,
}: FinanceProjectionCardProps) {
  const outlook = deriveOutlook(projection.gapPercent);
  const isAhead = projection.gap >= 0;
  const GapIcon = isAhead ? TrendingUp : projection.gap === 0 ? Minus : TrendingDown;

  const progressPct =
    projection.expectedYearEnd > 0
      ? Math.min(
          100,
          Math.round(
            (projection.projectedYearEnd / projection.expectedYearEnd) * 100,
          ),
        )
      : 0;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="font-semibold text-[var(--color-primary)]">
        {labels.title}
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.hint}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {labels.projected}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-foreground)]">
            {fmtCurrency(projection.projectedYearEnd, locale)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {labels.expected}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-foreground)]">
            {fmtCurrency(projection.expectedYearEnd, locale)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {labels.monthlyAvg}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-foreground)]">
            {fmtCurrency(projection.avgMonthlyCollection, locale)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {projection.monthsRemaining} {labels.monthsLeft}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-foreground)]">
            {projection.monthsRemaining}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
          <span>{labels.projected}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <GapIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium tabular-nums">
          {labels.gap}: {fmtCurrency(Math.abs(projection.gap), locale)}{" "}
          {isAhead ? labels.ahead : labels.behind}
        </span>
      </div>

      <div
        className={`mt-4 rounded-[var(--layout-border-radius)] border p-3 text-sm ${OUTLOOK_STYLES[outlook]}`}
      >
        {labels[outlook]}
      </div>
    </section>
  );
}
