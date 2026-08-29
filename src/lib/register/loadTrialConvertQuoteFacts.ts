import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
  resolveEffectiveMonthlyFee,
} from "@/lib/billing/resolveCohortFeeDefaults";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import { mapSectionFeePlanRow, type SectionFeePlanRowDb } from "@/types/sectionFeePlan";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";

export async function loadTrialConvertQuoteFacts(
  admin: SupabaseClient,
  input: { dni: string; sectionIds: string[]; now?: Date },
): Promise<{
  enrollmentAmounts: Record<string, number>;
  monthlyAmounts: Record<string, number>;
  alreadyPaidEnrollmentIds: string[];
  alreadyPaidMonthIds: string[];
  currency: string;
  openBySectionId: Record<string, boolean>;
}> {
  const ids = [...new Set(input.sectionIds.filter(Boolean))];
  const enrollmentAmounts: Record<string, number> = {};
  const monthlyAmounts: Record<string, number> = {};
  const openBySectionId: Record<string, boolean> = {};
  let currency = "USD";
  if (ids.length === 0) {
    return {
      enrollmentAmounts,
      monthlyAmounts,
      alreadyPaidEnrollmentIds: [],
      alreadyPaidMonthIds: [],
      currency,
      openBySectionId,
    };
  }

  const { data: sections } = await admin
    .from("academic_sections")
    .select(
      "id, enrollment_fee_amount, billing_mode, academic_cohorts(default_enrollment_fee_amount, default_monthly_fee)",
    )
    .in("id", ids);
  const { data: plans } = await admin
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .is("archived_at", null)
    .in("section_id", ids);

  const now = input.now ?? new Date();
  const { y, m } = instituteCalendarPartsInTimeZone(now, getInstituteTimeZone());
  const plansBySection = new Map<string, SectionFeePlanRowDb[]>();
  for (const row of (plans ?? []) as SectionFeePlanRowDb[]) {
    const list = plansBySection.get(row.section_id) ?? [];
    list.push(row);
    plansBySection.set(row.section_id, list);
  }

  for (const raw of sections ?? []) {
    const row = raw as Record<string, unknown>;
    const id = String(row.id);
    const cohortRel = row.academic_cohorts;
    const cohort = Array.isArray(cohortRel) ? cohortRel[0] : cohortRel;
    const cohortObj = (cohort ?? {}) as Record<string, unknown>;
    enrollmentAmounts[id] = resolveEffectiveEnrollmentFeeAmount(
      parseOptionalFeeAmount(row.enrollment_fee_amount),
      parseOptionalFeeAmount(cohortObj.default_enrollment_fee_amount),
    );
    const mapped = (plansBySection.get(id) ?? []).map(mapSectionFeePlanRow);
    const sectionPlan = resolveEffectiveSectionFeePlan(mapped, y, m);
    const monthly = resolveEffectiveMonthlyFee({
      billingMode: typeof row.billing_mode === "string" ? row.billing_mode : null,
      sectionPlan: sectionPlan
        ? { monthlyFee: sectionPlan.monthlyFee, currency: sectionPlan.currency }
        : null,
      cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohortObj.default_monthly_fee),
    });
    monthlyAmounts[id] =
      monthly.kind === "section" || monthly.kind === "cohort" ? monthly.monthlyFee : 0;
    if ((monthly.kind === "section" || monthly.kind === "cohort") && monthly.currency) {
      currency = monthly.currency;
    }
    openBySectionId[id] = await requestedSectionsHaveOpenSeats(admin, [id]);
  }

  const identity = await resolveExistingStudentByDni(admin, input.dni);
  const alreadyPaidEnrollmentIds: string[] = [];
  const alreadyPaidMonthIds: string[] = [];
  if (identity.kind === "student") {
    const { data: enrolls } = await admin
      .from("section_enrollments")
      .select("section_id, last_enrollment_paid_at, enrollment_fee_exempt")
      .eq("student_id", identity.studentId)
      .in("section_id", ids);
    for (const row of enrolls ?? []) {
      const id = String(row.section_id);
      if (row.enrollment_fee_exempt || row.last_enrollment_paid_at) {
        alreadyPaidEnrollmentIds.push(id);
      }
    }
    const { data: pays } = await admin
      .from("payments")
      .select("section_id, status")
      .eq("student_id", identity.studentId)
      .eq("year", y)
      .eq("month", m)
      .in("section_id", ids)
      .eq("status", "approved");
    for (const row of pays ?? []) {
      alreadyPaidMonthIds.push(String(row.section_id));
    }
  }

  return {
    enrollmentAmounts,
    monthlyAmounts,
    alreadyPaidEnrollmentIds,
    alreadyPaidMonthIds,
    currency,
    openBySectionId,
  };
}
