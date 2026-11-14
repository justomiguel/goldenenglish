import type { SupabaseClient } from "@supabase/supabase-js";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadCohortEnrollmentFeeAmount(
  supabase: SupabaseClient,
  cohortId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("academic_cohorts")
    .select("default_enrollment_fee_amount")
    .eq("id", cohortId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadCohortEnrollmentFeeAmount", error, { cohortId });
    return 0;
  }
  const row = data as { default_enrollment_fee_amount?: unknown } | null;
  return parseOptionalFeeAmount(row?.default_enrollment_fee_amount) ?? 0;
}
