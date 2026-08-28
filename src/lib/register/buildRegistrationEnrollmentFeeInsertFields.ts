import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRegistrationPayToken } from "@/lib/register/generateRegistrationPayToken";
import {
  buildRegistrationFeeSnapshot,
  type RegistrationFeeMode,
  type RegistrationFeeSnapshot,
} from "@/lib/register/registrationFeeSnapshot";
import { intakeStateForSnapshotTotal } from "@/lib/register/registrationIntake";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";
import { logServerException } from "@/lib/logging/serverActionLog";

export type RegistrationEnrollmentFeeInsertFields = {
  pay_token: string;
  fee_snapshot: RegistrationFeeSnapshot;
  intake_state: "none" | "awaiting_fee";
  fee_captured: false;
};

function emptyFields(nowIso: string): RegistrationEnrollmentFeeInsertFields {
  const fee_snapshot = buildRegistrationFeeSnapshot({
    mode: "per_section",
    currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
    nowIso,
    sections: [],
  });
  return {
    pay_token: generateRegistrationPayToken(),
    fee_snapshot,
    intake_state: intakeStateForSnapshotTotal(fee_snapshot.total),
    fee_captured: false,
  };
}

export async function buildRegistrationEnrollmentFeeInsertFields(input: {
  admin: SupabaseClient;
  sectionIds: string[];
  nowIso: string;
}): Promise<RegistrationEnrollmentFeeInsertFields> {
  try {
    return await loadFields(input);
  } catch (err) {
    logServerException("buildRegistrationEnrollmentFeeInsertFields", err);
    return emptyFields(input.nowIso);
  }
}

async function loadFields(input: {
  admin: SupabaseClient;
  sectionIds: string[];
  nowIso: string;
}): Promise<RegistrationEnrollmentFeeInsertFields> {
  const ids = [...new Set(input.sectionIds.filter(Boolean))];
  if (ids.length === 0) {
    const { data: cohort } = await input.admin
      .from("academic_cohorts")
      .select("enrollment_fee_mode")
      .eq("is_current", true)
      .maybeSingle();
    const mode = parseMode(cohort?.enrollment_fee_mode);
    const shared = 0;
    const fee_snapshot = buildRegistrationFeeSnapshot({
      mode,
      currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
      nowIso: input.nowIso,
      sections: [],
      sharedAmount: shared,
    });
    return {
      pay_token: generateRegistrationPayToken(),
      fee_snapshot,
      intake_state: intakeStateForSnapshotTotal(fee_snapshot.total),
      fee_captured: false,
    };
  }

  const { data: rows, error } = await input.admin
    .from("academic_sections")
    .select(
      "id, name, enrollment_fee_amount, cohort_id, academic_cohorts(enrollment_fee_mode, default_enrollment_fee_amount)",
    )
    .in("id", ids);
  if (error || !rows) return emptyFields(input.nowIso);

  const firstCohort = unwrapCohort(
    (rows[0] as { academic_cohorts?: RegistrationSectionCohortRel }).academic_cohorts,
  );
  const mode = parseMode(firstCohort?.enrollment_fee_mode);

  const fee_snapshot = buildRegistrationFeeSnapshot({
    mode,
    currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
    nowIso: input.nowIso,
    sections: rows.map((row) => {
      const typed = row as {
        id: string;
        name: string;
        enrollment_fee_amount?: unknown;
        academic_cohorts?: RegistrationSectionCohortRel;
      };
      const cohort = unwrapCohort(typed.academic_cohorts);
      return {
        id: String(typed.id),
        name: String(typed.name ?? ""),
        sectionAmount: parseOptionalFeeAmount(typed.enrollment_fee_amount),
        cohortDefault: parseOptionalFeeAmount(cohort?.default_enrollment_fee_amount),
      };
    }),
  });
  return {
    pay_token: generateRegistrationPayToken(),
    fee_snapshot,
    intake_state: intakeStateForSnapshotTotal(fee_snapshot.total),
    fee_captured: false,
  };
}

type RegistrationSectionCohort = {
  enrollment_fee_mode?: string | null;
  default_enrollment_fee_amount?: number | string | null;
};
type RegistrationSectionCohortRel =
  | RegistrationSectionCohort
  | RegistrationSectionCohort[]
  | null
  | undefined;

function unwrapCohort(
  rel: RegistrationSectionCohortRel,
): RegistrationSectionCohort | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

function parseMode(raw: unknown): RegistrationFeeMode {
  return raw === "once_for_all" ? "once_for_all" : "per_section";
}
