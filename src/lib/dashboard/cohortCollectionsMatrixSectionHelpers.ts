import type { SectionCollectionsView } from "@/types/sectionCollections";
import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";

export function formatCohortCollectionsMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCohortCollectionsPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(ratio);
}

export function sectionBillingSummary(view: SectionCollectionsView) {
  const firstRow = view.students[0]?.row ?? null;
  const currentPlan = firstRow?.currentPlan ?? null;
  const currency =
    currentPlan?.currency ?? firstRow?.enrollmentFeeCurrency ?? "USD";
  return {
    monthlyFee: currentPlan?.monthlyFee ?? null,
    enrollmentFee: firstRow?.enrollmentFeeAmount ?? 0,
    currency,
  };
}

export function studentCellCurrency(
  cells: SectionCollectionsView["students"][number]["row"]["cells"],
): string {
  for (const c of cells) {
    if (c.currency) return c.currency;
  }
  return "USD";
}

export function scholarshipDiscountForCohortMatrixPeriod(
  student: SectionCollectionsView["students"][number],
  year: number,
  month: number,
): number | null {
  const percent = effectiveScholarshipPercentForPeriod(student.scholarships, year, month);
  return percent > 0 ? percent : null;
}
