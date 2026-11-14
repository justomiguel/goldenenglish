import type { SupabaseClient } from "@supabase/supabase-js";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { loadOpenCohortEnrollmentDefault } from "@/lib/register/loadOpenCohortEnrollmentDefault";

export type CashMatriculaAmounts = {
  cohortAmount: number;
  sectionAmount: number;
};

type CohortRel =
  | { default_enrollment_fee_amount?: unknown }
  | { default_enrollment_fee_amount?: unknown }[]
  | null;

export async function loadRegistrationCashMatriculaAmounts(
  admin: SupabaseClient,
  sectionId: string | null,
): Promise<CashMatriculaAmounts> {
  if (!sectionId) {
    const inherited = await loadOpenCohortEnrollmentDefault(admin);
    return { cohortAmount: inherited?.amount ?? 0, sectionAmount: 0 };
  }
  const { data, error } = await admin
    .from("academic_sections")
    .select("enrollment_fee_amount, academic_cohorts(default_enrollment_fee_amount)")
    .eq("id", sectionId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadRegistrationCashMatriculaAmounts:section", error, { sectionId });
    return { cohortAmount: 0, sectionAmount: 0 };
  }
  if (!data) return { cohortAmount: 0, sectionAmount: 0 };
  const row = data as {
    enrollment_fee_amount?: unknown;
    academic_cohorts?: CohortRel;
  };
  const cohort = Array.isArray(row.academic_cohorts)
    ? row.academic_cohorts[0]
    : row.academic_cohorts;
  return {
    cohortAmount: parseOptionalFeeAmount(cohort?.default_enrollment_fee_amount) ?? 0,
    sectionAmount: parseOptionalFeeAmount(row.enrollment_fee_amount) ?? 0,
  };
}
