"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentPaymentsYearSummary as Summary } from "@/lib/billing/buildStudentPaymentsYearSummary";

type SummaryLabels = Dictionary["dashboard"]["student"]["monthly"]["summary"];

export interface StudentPaymentsYearSummaryProps {
  locale: Locale;
  summary: Summary;
  labels: SummaryLabels;
}

function formatMoney(locale: Locale, amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `$${formatted}`;
}

function monthName(locale: Locale, month: number): string {
  const date = new Date(2000, Math.max(0, month - 1), 1);
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
}

interface BucketTone {
  border: string;
  surface: string;
  accent: string;
  Icon: LucideIcon;
}

const TONES: Record<"paid" | "pending" | "overdue" | "upcoming", BucketTone> = {
  paid: {
    border: "border-[var(--color-success)]",
    surface: "bg-[var(--color-success)]/10",
    accent: "text-[var(--color-success)]",
    Icon: CheckCircle2,
  },
  pending: {
    border: "border-[var(--color-warning)]",
    surface: "bg-[var(--color-warning)]/15",
    accent: "text-[var(--color-foreground)]",
    Icon: Clock,
  },
  overdue: {
    border: "border-[var(--color-error)]",
    surface: "bg-[var(--color-surface)]",
    accent: "text-[var(--color-error)]",
    Icon: AlertTriangle,
  },
  upcoming: {
    border: "border-[var(--color-border)]",
    surface: "bg-[var(--color-muted)]",
    accent: "text-[var(--color-foreground)]",
    Icon: CalendarClock,
  },
};

interface BucketProps {
  tone: BucketTone;
  label: string;
  hint: string;
  amount: string;
}

function SummaryBucket({ tone, label, hint, amount }: BucketProps) {
  const { Icon } = tone;
  return (
    <div
      className={`rounded-[var(--layout-border-radius)] border ${tone.border} ${tone.surface} p-4`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone.accent}`} aria-hidden />
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${tone.accent}`}>{amount}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
    </div>
  );
}

export function StudentPaymentsYearSummary({
  locale,
  summary,
  labels,
}: StudentPaymentsYearSummaryProps) {
  const heading = useMemo(
    () => labels.heading.replace("{year}", String(summary.year)),
    [labels.heading, summary.year],
  );

  const nextDueLine = summary.nextDue
    ? labels.nextDueLine
        .replace("{section}", summary.nextDue.sectionName)
        .replace("{month}", monthName(locale, summary.nextDue.month))
        .replace("{year}", String(summary.nextDue.year))
        .replace("{amount}", formatMoney(locale, summary.nextDue.amount))
    : null;

  return (
    <section
      className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-6"
      aria-labelledby="student-payments-year-summary-heading"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id="student-payments-year-summary-heading"
            className="font-display text-lg font-semibold text-[var(--color-secondary)]"
          >
            {heading}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryBucket
          tone={TONES.paid}
          label={labels.paid}
          hint={labels.paidHint}
          amount={formatMoney(locale, summary.paid)}
        />
        <SummaryBucket
          tone={TONES.pending}
          label={labels.pendingReview}
          hint={labels.pendingReviewHint}
          amount={formatMoney(locale, summary.pendingReview)}
        />
        <SummaryBucket
          tone={TONES.overdue}
          label={labels.overdue}
          hint={labels.overdueHint}
          amount={formatMoney(locale, summary.overdue)}
        />
        <SummaryBucket
          tone={TONES.upcoming}
          label={labels.upcoming}
          hint={labels.upcomingHint}
          amount={formatMoney(locale, summary.upcoming)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 lg:col-span-2"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.totalDebt}
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-[var(--color-primary)]">
            {formatMoney(locale, summary.totalDebt)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.totalDebtHint}
          </p>
          {summary.creditBalance > 0 ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-3 py-1 text-xs text-[var(--color-info)]">
              <Sparkles className="h-3 w-3" aria-hidden />
              <span>
                {labels.creditBalance}: {formatMoney(locale, summary.creditBalance)}
              </span>
              <span className="text-[var(--color-muted-foreground)]">
                · {labels.creditBalanceHint}
              </span>
            </p>
          ) : null}
        </div>

        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.nextDueLabel}
          </p>
          {nextDueLine ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
              {nextDueLine}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {labels.noNextDue}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
