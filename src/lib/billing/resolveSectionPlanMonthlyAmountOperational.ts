import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { fallbackFullMonthProration } from "@/lib/billing/studentMonthlyPaymentsRowModel";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import type { SectionScheduleSlot } from "@/types/academics";

type OperationalAmountResult =
  | {
      code: "ok";
      amount: number;
      currency: string;
      proration: { numerator: number; denominator: number; full: boolean };
    }
  | { code: "out_of_period" };

export function resolveOperationalWindowMonthlyAmount(input: {
  monthlyFee: number;
  currency: string;
  monthlyFeeChargeMode: MonthlyFeeChargeMode;
  sectionFrom: Date | null;
  sectionUntil: Date | null;
  scheduleSlots: SectionScheduleSlot[];
  enrolledAt: Date | null;
  year: number;
  month: number;
  scholarships: ScholarshipRow[];
}): OperationalAmountResult {
  const sectionRange =
    input.sectionFrom &&
    input.sectionUntil &&
    input.sectionFrom.getTime() <= input.sectionUntil.getTime()
      ? { from: input.sectionFrom, until: input.sectionUntil }
      : null;
  const monthRange = monthBounds(input.year, input.month);
  const sectionInMonth = sectionRange ? intersectDateRange(sectionRange, monthRange) : null;
  const totalClasses = sectionInMonth
    ? countSectionMonthlyClasses({
        scheduleSlots: input.scheduleSlots,
        from: sectionInMonth.from,
        until: sectionInMonth.until,
      })
    : 0;
  const studentRange =
    input.enrolledAt && sectionInMonth
      ? intersectDateRange(sectionInMonth, {
          from: input.enrolledAt,
          until: monthRange.until,
        })
      : sectionInMonth;
  const availableClasses = studentRange
    ? countSectionMonthlyClasses({
        scheduleSlots: input.scheduleSlots,
        from: studentRange.from,
        until: studentRange.until,
      })
    : 0;

  const prorated =
    input.monthlyFeeChargeMode === "full_month_fee"
      ? sectionInMonth && studentRange
        ? fallbackFullMonthProration(input.monthlyFee)
        : ({ code: "out_of_period" as const })
      : totalClasses > 0 && availableClasses > 0
        ? prorateMonthlyFee({
            monthlyFee: input.monthlyFee,
            totalClassesInMonth: totalClasses,
            availableClassesForStudent: availableClasses,
          })
        : sectionInMonth && studentRange
          ? fallbackFullMonthProration(input.monthlyFee)
          : ({ code: "out_of_period" as const });

  if (prorated.code !== "ok") return { code: "out_of_period" };

  const adjusted = effectiveAmountAfterScholarship(
    prorated.amount,
    input.year,
    input.month,
    input.scholarships,
  );
  return {
    code: "ok",
    amount: adjusted ?? prorated.amount,
    currency: input.currency,
    proration: {
      numerator: prorated.numerator,
      denominator: prorated.denominator,
      full: prorated.full,
    },
  };
}
