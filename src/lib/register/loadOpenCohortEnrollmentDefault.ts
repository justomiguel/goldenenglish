import type { SupabaseClient } from "@supabase/supabase-js";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { logServerError, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveRegistrationCohortState } from "@/lib/settings/inscriptionsServer";

export type OpenCohortEnrollmentDefault = {
  id: string;
  name: string;
  amount: number;
};

type CohortRow = {
  id?: unknown;
  name?: unknown;
  is_current?: unknown;
  default_enrollment_fee_amount?: unknown;
};

/** Matrícula of the cohort that receives a lead with no section. Null when that fee is 0 or missing. */
export async function loadOpenCohortEnrollmentDefault(
  admin: SupabaseClient,
): Promise<OpenCohortEnrollmentDefault | null> {
  try {
    const [{ data: setting, error: settingError }, { data: cohorts, error: cohortError }] =
      await Promise.all([
        admin
          .from("site_settings")
          .select("value")
          .eq("key", "registration_cohort_id")
          .limit(1),
        admin
          .from("academic_cohorts")
          .select("id, name, is_current, default_enrollment_fee_amount")
          .is("archived_at", null),
      ]);
    if (settingError) {
      logSupabaseClientError("loadOpenCohortEnrollmentDefault:settings", settingError);
      return null;
    }
    if (cohortError) {
      logSupabaseClientError("loadOpenCohortEnrollmentDefault:cohorts", cohortError);
      return null;
    }
    if (!Array.isArray(cohorts)) return null;
    const rows = cohorts as CohortRow[];
    const options = rows.map((row) => ({
      id: String(row.id ?? ""),
      name: String(row.name ?? ""),
      isCurrent: row.is_current === true,
    }));
    const state = resolveRegistrationCohortState(options, firstSettingValue(setting));
    const active = rows.find((row) => String(row.id ?? "") === state.activeCohort?.id);
    if (!active) return null;
    const amount = parseOptionalFeeAmount(active.default_enrollment_fee_amount) ?? 0;
    if (amount <= 0) return null;
    return { id: String(active.id), name: String(active.name ?? ""), amount };
  } catch (error) {
    void logServerError("loadOpenCohortEnrollmentDefault", {
      code: "cohort_fee_lookup_failed",
      message: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

function firstSettingValue(data: unknown): unknown {
  if (Array.isArray(data)) return (data[0] as { value?: unknown } | undefined)?.value ?? null;
  if (data && typeof data === "object" && "value" in data) return (data as { value?: unknown }).value;
  return null;
}
