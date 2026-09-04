import { planJoinBillingMonths } from "@/lib/billing/planJoinBillingMonths";
import { instituteYearMonth } from "@/lib/register/sectionHasRemainingClassThisMonth";

export type JoinPackageYearMonth = { year: number; month: number };

function nextYearMonth(ym: JoinPackageYearMonth): JoinPackageYearMonth {
  return ym.month === 12 ? { year: ym.year + 1, month: 1 } : { year: ym.year, month: ym.month + 1 };
}

export function pickJoinPackageMonth(input: {
  hasRemainingClassThisMonth: boolean;
  sectionStartsOn: string | null;
  sectionEndsOn: string | null;
  now: Date;
  timeZone: string;
}): JoinPackageYearMonth | null {
  const current = instituteYearMonth(input.now, input.timeZone);
  if (input.hasRemainingClassThisMonth) return current;
  const next = nextYearMonth(current);
  const plan = planJoinBillingMonths({
    sectionStartsOn: input.sectionStartsOn,
    sectionEndsOn: input.sectionEndsOn,
    joinYear: next.year,
    joinMonth: next.month,
  });
  return plan.joinIsBillable ? next : null;
}
