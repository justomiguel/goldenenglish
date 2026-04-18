import type { SupabaseClient } from "@supabase/supabase-js";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import {
  isMonthInPlanPeriod,
  resolveEffectiveSectionFeePlan,
} from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  mapSectionFeePlanRow,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";

export type SectionPlanAmountResult =
  | { code: "ok"; amount: number }
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

/**
 * Server-side: resolves the monthly amount the student must pay for a given
 * (sectionId, year, month), applying the section's effective plan and any
 * active student scholarship.
 */
export async function resolveSectionPlanMonthlyAmount(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
  year: number,
  month: number,
): Promise<SectionPlanAmountResult> {
  const { data: planRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, payments_count, charges_enrollment_fee, period_start_year, period_start_month, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  const plans = ((planRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
  const plan = resolveEffectiveSectionFeePlan(plans, year, month);
  if (!plan) return { code: "no_plan" };
  if (!isMonthInPlanPeriod(plan, year, month)) return { code: "out_of_period" };

  const { data: scholarshipRow } = await supabase
    .from("student_scholarships")
    .select(
      "discount_percent, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("student_id", studentId)
    .maybeSingle();
  const scholarship: ScholarshipRow | null = scholarshipRow
    ? {
        discount_percent: Number((scholarshipRow as { discount_percent: number }).discount_percent),
        valid_from_year: (scholarshipRow as { valid_from_year: number }).valid_from_year,
        valid_from_month: (scholarshipRow as { valid_from_month: number }).valid_from_month,
        valid_until_year: (scholarshipRow as { valid_until_year: number | null }).valid_until_year,
        valid_until_month: (scholarshipRow as { valid_until_month: number | null }).valid_until_month,
        is_active: Boolean((scholarshipRow as { is_active: boolean }).is_active),
      }
    : null;

  const adjusted = effectiveAmountAfterScholarship(plan.monthlyFee, year, month, scholarship);
  return { code: "ok", amount: adjusted ?? plan.monthlyFee };
}
