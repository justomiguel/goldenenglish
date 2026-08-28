import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import { round2 } from "@/lib/billing/sectionCollectionsAggregates";
import type { AdminStudentBillingSectionBenefit } from "@/types/adminStudentBilling";

export type MonthlyDueLine = {
  listAmount: number | null;
  currency: string | null;
  discountPercent: number | null;
  skip?: boolean;
};

export type MonthlyDueTotal = {
  amount: number;
  currency: string;
};

export function applyListDiscount(listAmount: number, discountPercent: number | null): number {
  const pct =
    discountPercent != null && Number.isFinite(discountPercent)
      ? Math.min(100, Math.max(0, discountPercent))
      : 0;
  return round2(listAmount * Math.max(0, 1 - pct / 100));
}

export function sumDiscountedMonthlyDue(lines: readonly MonthlyDueLine[]): MonthlyDueTotal[] {
  const byCurrency = new Map<string, number>();
  for (const line of lines) {
    if (line.skip) continue;
    if (line.listAmount == null || !Number.isFinite(line.listAmount) || line.listAmount < 0) {
      continue;
    }
    const currency = line.currency?.trim().toUpperCase() ?? "";
    if (currency.length !== 3) continue;
    const due = applyListDiscount(line.listAmount, line.discountPercent);
    byCurrency.set(currency, round2((byCurrency.get(currency) ?? 0) + due));
  }
  return [...byCurrency.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function monthlyDueLinesFromSectionBenefits(
  benefits: readonly AdminStudentBillingSectionBenefit[],
  year: number,
  month: number,
): MonthlyDueLine[] {
  return benefits.map((benefit) => ({
    skip: sectionIsClassPackBilled(benefit.sectionBillingMode),
    listAmount: benefit.sectionMonthlyFeeAmount,
    currency: benefit.sectionMonthlyFeeCurrency,
    discountPercent: effectiveScholarshipPercentForPeriod(benefit.scholarships, year, month),
  }));
}

export function formatMonthlyDueTotals(
  totals: readonly MonthlyDueTotal[],
  locale: string,
): string {
  return totals
    .map((total) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: total.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(total.amount);
      } catch {
        return `${total.amount} ${total.currency}`;
      }
    })
    .join(" · ");
}
