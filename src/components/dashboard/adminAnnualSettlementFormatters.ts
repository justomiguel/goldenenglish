import type { Dictionary } from "@/types/i18n";
import type { AdminBillingAnnualSettlement } from "@/types/adminStudentBilling";

export function billingRangeLabel(
  fromM: number,
  fromY: number,
  untilM: number,
  untilY: number,
): string {
  if (fromY === untilY && fromM === 1 && untilM === 12) {
    return String(fromY);
  }
  return `${fromM}/${fromY}–${untilM}/${untilY}`;
}

export function formatAnnualSettlementExistingLine(input: {
  settlement: AdminBillingAnnualSettlement;
  labels: Dictionary["admin"]["billing"]["annualSettlement"];
  formatMoney: (n: number, cur: string) => string;
}): string {
  const { settlement: s, labels, formatMoney } = input;
  return labels.existingLine
    .replace("{range}", billingRangeLabel(
      s.coverageFromMonth,
      s.coverageFromYear,
      s.coverageUntilMonth,
      s.coverageUntilYear,
    ))
    .replace("{accepted}", formatMoney(s.acceptedTotal, s.currency))
    .replace("{discount}", formatMoney(s.impliedDiscountAmount, s.currency))
    .replace("{currency}", s.currency)
    .replace(
      "{feeHint}",
      s.includesEnrollmentFee ? ` · ${labels.feeIncluded}` : ` · ${labels.feeExcluded}`,
    );
}
