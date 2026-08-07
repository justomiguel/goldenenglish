import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CircleDollarSign,
  Forward,
  GraduationCap,
  Scale,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { formatSectionFeePlanLabel } from "@/lib/billing/formatSectionFeePlanLabel";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

type FeePlansDict = Dictionary["dashboard"]["academicSectionPage"]["feePlans"];

export interface AcademicSectionFeesSummaryDict {
  title: string;
  monthlyPlanLabel: string;
  monthlyPlanEmpty: string;
  enrollmentLabel: string;
  enrollmentNone: string;
  chargeBasisLabel: string;
  advanceLabel: string;
  advanceYes: string;
  advanceNo: string;
}

export interface AcademicSectionFeesSummaryProps {
  dict: AcademicSectionFeesSummaryDict;
  feePlansDict: FeePlansDict;
  currentPlan: SectionFeePlan | null;
  enrollmentFeeAmount: number;
  systemCurrency: string;
  chargeModeLabel: string;
  allowAdvance: boolean;
}

function KpiTile({
  icon: Icon,
  label,
  value,
  emphasize = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <li
      className={
        emphasize
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 px-4 py-3 sm:col-span-2"
          : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            emphasize
              ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-primary)]"
          }
          aria-hidden
        >
          <Icon className={emphasize ? "h-6 w-6" : "h-5 w-5"} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {label}
          </p>
          <p
            className={
              emphasize
                ? "mt-1 text-lg font-semibold text-[var(--color-foreground)] text-balance"
                : "mt-1 text-sm font-semibold text-[var(--color-foreground)] text-balance"
            }
          >
            {value}
          </p>
        </div>
      </div>
    </li>
  );
}

export function AcademicSectionFeesSummary({
  dict,
  feePlansDict,
  currentPlan,
  enrollmentFeeAmount,
  systemCurrency,
  chargeModeLabel,
  allowAdvance,
}: AcademicSectionFeesSummaryProps) {
  const planLine = currentPlan
    ? formatSectionFeePlanLabel(currentPlan, feePlansDict)
    : dict.monthlyPlanEmpty;
  const enrollmentLine =
    enrollmentFeeAmount > 0
      ? `${systemCurrency} ${enrollmentFeeAmount.toFixed(2)}`
      : dict.enrollmentNone;

  return (
    <section
      aria-label={dict.title}
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          aria-hidden
        >
          <CircleDollarSign className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiTile icon={CalendarClock} label={dict.monthlyPlanLabel} value={planLine} emphasize />
        <KpiTile icon={GraduationCap} label={dict.enrollmentLabel} value={enrollmentLine} />
        <KpiTile icon={Scale} label={dict.chargeBasisLabel} value={chargeModeLabel} />
        <KpiTile
          icon={Forward}
          label={dict.advanceLabel}
          value={allowAdvance ? dict.advanceYes : dict.advanceNo}
        />
      </ul>
    </section>
  );
}
