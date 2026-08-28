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
import { parseMonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import { resolveOperationalWindowMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmountOperational";
import {
  periodInAnnualSettlementCoverage,
  type AnnualSettlementCoverageRow,
} from "@/lib/billing/annualSettlementPeriod";
import {
  loadAnnualSettlementsForEnrollment,
  loadScholarshipRowsForEnrollment,
  loadSectionBillingContext,
  parseUtcDate,
} from "@/lib/billing/resolveSectionPlanMonthlyAmountSupport";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import {
  parseOptionalFeeAmount,
  resolveEffectiveMonthlyFee,
} from "@/lib/billing/resolveCohortFeeDefaults";

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
  | { code: "out_of_period" }
  /**
   * La sección se cobra por bolsa de clases prepagas (`student_class_packs`), no por cuota mensual.
   * Nunca hay un monto mensual que resolver: los llamadores deben tratar este código explícitamente en
   * vez de asumir que cualquier resultado que no sea `no_plan` / `out_of_period` es cobrable.
   */
  | { code: "class_pack_section" };

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

  // Antes que cualquier rama monetaria, y antes de `no_plan`: una sección por paquete no tiene plan de
  // cuotas, y devolver `no_plan` haría parecer un error de configuración lo que es otro producto.
  const sec = await loadSectionBillingContext(supabase, sectionId);
  if (sectionIsClassPackBilled(sec?.billing_mode)) return { code: "class_pack_section" };

  const { data: planRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  const plans = ((planRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
  const sectionPlan = resolveEffectiveSectionFeePlan(plans, year, month);
  const cohortRel = sec?.academic_cohorts;
  const cohort = Array.isArray(cohortRel) ? cohortRel[0] : cohortRel;
  const monthly = resolveEffectiveMonthlyFee({
    billingMode: sec?.billing_mode,
    sectionPlan: sectionPlan
      ? { monthlyFee: sectionPlan.monthlyFee, currency: sectionPlan.currency }
      : null,
    cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohort?.default_monthly_fee),
  });
  if (monthly.kind === "class_pack") return { code: "class_pack_section" };
  if (monthly.kind === "none") return { code: "no_plan" };
  const plan = {
    monthlyFee: monthly.monthlyFee,
    currency: monthly.currency,
  };

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

  const scholarships =
    options?.ignoreScholarships || annualSuppressesScholarship
      ? []
      : await loadScholarshipRowsForEnrollment(
          supabase,
          enrollmentRow?.id ?? null,
        );

  return resolveOperationalWindowMonthlyAmount({
    monthlyFee: plan.monthlyFee,
    currency: plan.currency,
    monthlyFeeChargeMode: parseMonthlyFeeChargeMode(sec?.monthly_fee_charge_mode),
    sectionFrom: parseUtcDate(sec?.starts_on ?? null),
    sectionUntil: parseUtcDate(sec?.ends_on ?? null),
    scheduleSlots: parseSectionScheduleSlots(sec?.schedule_slots ?? []),
    enrolledAt: parseUtcDate(enrollmentRow?.created_at ?? null),
    year,
    month,
    scholarships,
  });
}
