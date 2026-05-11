import type { SupabaseClient } from "@supabase/supabase-js";
import {
  effectiveAmountAfterScholarship,
} from "@/lib/billing/scholarshipPeriod";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  mapSectionFeePlanRow,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import { fallbackFullMonthProration } from "@/lib/billing/studentMonthlyPaymentsRowModel";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";
import { parseMonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import {
  periodInAnnualSettlementCoverage,
  type AnnualSettlementCoverageRow,
} from "@/lib/billing/annualSettlementPeriod";
import {
  loadAnnualSettlementsForEnrollment,
  loadScholarshipRowsForEnrollment,
  parseUtcDate,
} from "@/lib/billing/resolveSectionPlanMonthlyAmountSupport";

/** Matches `buildStudentMonthlyPaymentsRow` / admin Cobranzas matrices. */
export type ResolveSectionPlanBillingScope = "operational-window" | "plan-year";

export type ResolveSectionPlanMonthlyAmountOptions = {
  /**
   * `plan-year`: full plan fee for the calendar month (admin matrices).
   * `operational-window`: student-facing amount — class prorate vs full month
   * per section `monthly_fee_charge_mode` (alumno/padre / Flow).
   * @default "operational-window"
   */
  billingScope?: ResolveSectionPlanBillingScope;
  /**
   * List / plan price without applying percentage scholarships (annual settlement baseline).
   */
  ignoreScholarships?: boolean;
};

export type SectionPlanAmountResult =
  | {
      code: "ok";
      amount: number;
      currency: string;
      proration: { numerator: number; denominator: number; full: boolean };
    }
  | { code: "no_plan" }
  | { code: "out_of_period" };

export async function isStudentActivelyEnrolledInSection(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("section_enrollments")
    .select("id")
    .eq("section_id", sectionId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

type EnrollmentRow = {
  id: string;
  created_at: string | null;
};

/**
 * Server-side: resolves the monthly amount the student must pay for a given
 * (sectionId, year, month), applying the section's effective plan, monthly
 * proration based on available classes for that student, and any active
 * student scholarship.
 */
export async function resolveSectionPlanMonthlyAmount(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
  year: number,
  month: number,
  options?: ResolveSectionPlanMonthlyAmountOptions,
): Promise<SectionPlanAmountResult> {
  const billingScope: ResolveSectionPlanBillingScope =
    options?.billingScope ?? "operational-window";

  const { data: planRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  const plans = ((planRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
  const plan = resolveEffectiveSectionFeePlan(plans, year, month);
  if (!plan) return { code: "no_plan" };

  const { data: enrolment } = await supabase
    .from("section_enrollments")
    .select("id, created_at")
    .eq("section_id", sectionId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  const enrollmentRow = enrolment as EnrollmentRow | null;

  let annualSettlementRows: AnnualSettlementCoverageRow[] = [];
  if (!options?.ignoreScholarships && enrollmentRow?.id) {
    annualSettlementRows = await loadAnnualSettlementsForEnrollment(
      supabase,
      enrollmentRow.id,
    );
  }
  const annualSuppressesScholarship =
    !options?.ignoreScholarships &&
    annualSettlementRows.some((row) => periodInAnnualSettlementCoverage(year, month, row));

  if (billingScope === "plan-year") {
    const prorated = fallbackFullMonthProration(plan.monthlyFee);
    const scholarships =
      options?.ignoreScholarships || annualSuppressesScholarship
        ? []
        : await loadScholarshipRowsForEnrollment(
            supabase,
            enrollmentRow?.id ?? null,
          );
    const adjusted = effectiveAmountAfterScholarship(
      prorated.amount,
      year,
      month,
      scholarships,
    );
    return {
      code: "ok",
      amount: adjusted ?? prorated.amount,
      currency: plan.currency,
      proration: {
        numerator: prorated.numerator,
        denominator: prorated.denominator,
        full: prorated.full,
      },
    };
  }

  const { data: secRow } = await supabase
    .from("academic_sections")
    .select("starts_on, ends_on, schedule_slots, monthly_fee_charge_mode")
    .eq("id", sectionId)
    .maybeSingle();
  const sec = secRow as
    | {
        starts_on: string | null;
        ends_on: string | null;
        schedule_slots: unknown;
        monthly_fee_charge_mode?: string | null;
      }
    | null;
  const monthlyFeeChargeMode = parseMonthlyFeeChargeMode(sec?.monthly_fee_charge_mode);
  const sectionFrom = parseUtcDate(sec?.starts_on ?? null);
  const sectionUntil = parseUtcDate(sec?.ends_on ?? null);
  const sectionRange =
    sectionFrom && sectionUntil && sectionFrom.getTime() <= sectionUntil.getTime()
      ? { from: sectionFrom, until: sectionUntil }
      : null;
  const scheduleSlots = parseSectionScheduleSlots(sec?.schedule_slots ?? []);

  const enrolledAt = parseUtcDate(enrollmentRow?.created_at ?? null);

  const monthRange = monthBounds(year, month);
  const sectionInMonth = sectionRange ? intersectDateRange(sectionRange, monthRange) : null;
  const totalClasses = sectionInMonth
    ? countSectionMonthlyClasses({
        scheduleSlots,
        from: sectionInMonth.from,
        until: sectionInMonth.until,
      })
    : 0;
  const studentRange = enrolledAt && sectionInMonth
    ? intersectDateRange(sectionInMonth, { from: enrolledAt, until: monthRange.until })
    : sectionInMonth;
  const availableClasses = studentRange
    ? countSectionMonthlyClasses({
        scheduleSlots,
        from: studentRange.from,
        until: studentRange.until,
      })
    : 0;

  /** Same branch order as {@link buildStudentMonthlyPaymentsRow} so Flow/receipt flows match student/tutor strips. */
  const prorated =
    monthlyFeeChargeMode === "full_month_fee"
      ? sectionInMonth && studentRange
        ? fallbackFullMonthProration(plan.monthlyFee)
        : ({ code: "out_of_period" as const })
      : totalClasses > 0 && availableClasses > 0
        ? prorateMonthlyFee({
            monthlyFee: plan.monthlyFee,
            totalClassesInMonth: totalClasses,
            availableClassesForStudent: availableClasses,
          })
        : sectionInMonth && studentRange
          ? fallbackFullMonthProration(plan.monthlyFee)
          : ({ code: "out_of_period" as const });

  if (prorated.code !== "ok") return { code: "out_of_period" };

  const scholarships =
    options?.ignoreScholarships || annualSuppressesScholarship
      ? []
      : await loadScholarshipRowsForEnrollment(
          supabase,
          enrollmentRow?.id ?? null,
        );

  const adjusted = effectiveAmountAfterScholarship(
    prorated.amount,
    year,
    month,
    scholarships,
  );
  return {
    code: "ok",
    amount: adjusted ?? prorated.amount,
    currency: plan.currency,
    proration: {
      numerator: prorated.numerator,
      denominator: prorated.denominator,
      full: prorated.full,
    },
  };
}
