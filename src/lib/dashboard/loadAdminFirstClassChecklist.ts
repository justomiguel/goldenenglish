import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import {
  buildAdminFirstClassChecklistContext,
  deriveAdminFirstClassChecklistFacts,
} from "@/lib/dashboard/deriveAdminFirstClassChecklistFacts";
import {
  evaluateAdminFirstClassChecklist,
  type AdminFirstClassChecklist,
  type AdminFirstClassChecklistFacts,
} from "@/lib/dashboard/evaluateAdminFirstClassChecklist";
import { logServerException } from "@/lib/logging/serverActionLog";

const EMPTY_FACTS: AdminFirstClassChecklistFacts = {
  hasStudent: false,
  hasTeacher: false,
  hasCohort: false,
  hasSection: false,
  hasTeacherAssignedToSection: false,
  hasStudentEnrolledInSection: false,
  hasSectionSchedule: false,
  hasSectionFees: false,
  hasPaymentMethod: false,
};

async function countExact(
  result: PromiseLike<{ count: number | null }>,
): Promise<number> {
  const { count } = await result;
  return count ?? 0;
}

export async function loadAdminFirstClassChecklist(
  supabase: SupabaseClient,
  locale: string,
): Promise<AdminFirstClassChecklist> {
  try {
    return await loadAdminFirstClassChecklistUnsafe(supabase, locale);
  } catch (err) {
    logServerException("loadAdminFirstClassChecklist", err);
    return evaluateAdminFirstClassChecklist(EMPTY_FACTS, locale);
  }
}

async function loadAdminFirstClassChecklistUnsafe(
  supabase: SupabaseClient,
  locale: string,
): Promise<AdminFirstClassChecklist> {
  const [
    studentCount,
    teacherCount,
    cohortsResult,
    sectionsResult,
    activeEnrollmentCount,
    monthlyPlanCount,
    classPackPriceCount,
    bankTransfer,
    enabledGatewayCount,
  ] = await Promise.all([
    countExact(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .eq("role", "student"),
    ),
    countExact(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .eq("role", "teacher"),
    ),
    supabase
      .from("academic_cohorts")
      .select("id")
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase
      .from("academic_sections")
      .select("id, cohort_id, teacher_id, schedule_slots, enrollment_fee_amount, billing_mode")
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    countExact(
      supabase
        .from("section_enrollments")
        .select("id", { head: true, count: "exact" })
        .eq("status", "active"),
    ),
    countExact(
      supabase
        .from("section_fee_plans")
        .select("id", { head: true, count: "exact" })
        .is("archived_at", null)
        .gt("monthly_fee", 0),
    ),
    countExact(
      supabase.from("class_pack_prices").select("id", { head: true, count: "exact" }),
    ),
    loadBankTransferInstructionsSetting(supabase),
    countExact(
      supabase
        .from("payment_gateway_credentials")
        .select("id", { head: true, count: "exact" })
        .eq("enabled", true),
    ),
  ]);

  const cohortRows = Array.isArray(cohortsResult.data) ? cohortsResult.data : [];
  const sectionRows = Array.isArray(sectionsResult.data) ? sectionsResult.data : [];
  const mappedSections = sectionRows.map((row) => ({
    id: row.id == null ? undefined : String(row.id),
    cohortId: row.cohort_id == null ? undefined : String(row.cohort_id),
    teacherId: row.teacher_id == null ? null : String(row.teacher_id),
    scheduleSlots: row.schedule_slots,
    enrollmentFeeAmount: row.enrollment_fee_amount as number | string | null,
    billingMode: row.billing_mode == null ? null : String(row.billing_mode),
  }));
  const extras = {
    hasMonthlyFeePlan: monthlyPlanCount > 0,
    hasClassPackPrice: classPackPriceCount > 0,
  };
  const facts = deriveAdminFirstClassChecklistFacts({
    studentCount,
    teacherCount,
    activeCohortCount: cohortRows.length,
    sections: mappedSections,
    activeEnrollmentCount,
    ...extras,
    bankTransferInstructions: bankTransfer.instructions,
    enabledGatewayCount,
  });
  const context = buildAdminFirstClassChecklistContext(
    cohortRows[0]?.id == null ? null : String(cohortRows[0].id),
    mappedSections,
    extras,
  );

  return evaluateAdminFirstClassChecklist(facts, locale, context);
}
