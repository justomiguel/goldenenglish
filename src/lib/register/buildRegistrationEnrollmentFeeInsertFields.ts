import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRegistrationPayToken } from "@/lib/register/generateRegistrationPayToken";
import {
  type RegistrationFeeMode,
  type RegistrationFeeSnapshot,
} from "@/lib/register/registrationFeeSnapshot";
import { intakeStateForSnapshotTotal } from "@/lib/register/registrationIntake";
import { parseOptionalFeeAmount, resolveEffectiveMonthlyFee } from "@/lib/billing/resolveCohortFeeDefaults";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";
import { logServerException } from "@/lib/logging/serverActionLog";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { loadFamilyBillingPolicy } from "@/lib/billing/loadFamilyBillingPolicy";
import { loadStudentPaidTrialCredit } from "@/lib/billing/loadStudentPaidTrialCredit";
import { planJoinPackageQuote } from "@/lib/register/planJoinPackageQuote";

export type RegistrationEnrollmentFeeInsertFields = {
  pay_token: string;
  fee_snapshot: RegistrationFeeSnapshot;
  intake_state: "none" | "awaiting_fee" | "needs_section";
  fee_captured: false;
};

function emptyFields(
  nowIso: string,
  intake: "none" | "needs_section" = "none",
): RegistrationEnrollmentFeeInsertFields {
  const fee_snapshot = planJoinPackageQuote({
    mode: "per_section",
    currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
    nowIso,
    now: new Date(nowIso),
    timeZone: "UTC",
    sections: [],
  });
  return {
    pay_token: generateRegistrationPayToken(),
    fee_snapshot,
    intake_state: intake,
    fee_captured: false,
  };
}

export async function buildRegistrationEnrollmentFeeInsertFields(input: {
  admin: SupabaseClient;
  sectionIds: string[];
  nowIso: string;
  dni?: string | null;
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
  dni?: string | null;
}): Promise<RegistrationEnrollmentFeeInsertFields> {
  const ids = [...new Set(input.sectionIds.filter(Boolean))];
  const now = new Date(input.nowIso);
  const timeZone = getInstituteTimeZone();
  if (ids.length === 0) {
    const fee_snapshot = planJoinPackageQuote({
      mode: "per_section",
      currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
      nowIso: input.nowIso,
      now,
      timeZone,
      sections: [],
    });
    return {
      pay_token: generateRegistrationPayToken(),
      fee_snapshot,
      intake_state: "needs_section",
      fee_captured: false,
    };
  }

  const { data: rows, error } = await input.admin
    .from("academic_sections")
    .select(
      "id, name, enrollment_fee_amount, billing_mode, starts_on, ends_on, schedule_slots, academic_cohorts(enrollment_fee_mode, default_enrollment_fee_amount, default_monthly_fee)",
    )
    .in("id", ids);
  if (error || !rows) return emptyFields(input.nowIso);

  const firstCohort = unwrapCohort(
    (rows[0] as { academic_cohorts?: RegistrationSectionCohortRel }).academic_cohorts,
  );
  const credit = await resolveTrialCredit(input.admin, input.dni);

  const fee_snapshot = planJoinPackageQuote({
    mode: parseMode(firstCohort?.enrollment_fee_mode),
    currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
    nowIso: input.nowIso,
    now,
    timeZone,
    sections: rows.map((row) => mapSection(row)),
    trialPaid: credit.trialPaid,
    trialAlreadyCredited: credit.alreadyCredited,
    creditEnabled: credit.enabled,
  });
  return {
    pay_token: generateRegistrationPayToken(),
    fee_snapshot,
    intake_state: intakeStateForSnapshotTotal(fee_snapshot.total),
    fee_captured: false,
  };
}

function mapSection(row: unknown): Parameters<typeof planJoinPackageQuote>[0]["sections"][0] {
  const typed = row as {
    id: string;
    name: string;
    enrollment_fee_amount?: unknown;
    billing_mode?: unknown;
    starts_on?: unknown;
    ends_on?: unknown;
    schedule_slots?: unknown;
    academic_cohorts?: RegistrationSectionCohortRel;
  };
  const cohort = unwrapCohort(typed.academic_cohorts);
  const monthly = resolveEffectiveMonthlyFee({
    billingMode: typeof typed.billing_mode === "string" ? typed.billing_mode : null,
    sectionPlan: null,
    cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohort?.default_monthly_fee),
  });
  return {
    id: String(typed.id),
    name: String(typed.name ?? ""),
    sectionAmount: parseOptionalFeeAmount(typed.enrollment_fee_amount),
    cohortDefault: parseOptionalFeeAmount(cohort?.default_enrollment_fee_amount),
    monthlyAmount:
      monthly.kind === "section" || monthly.kind === "cohort" ? monthly.monthlyFee : 0,
    billingMode: typeof typed.billing_mode === "string" ? typed.billing_mode : null,
    slots: parseSectionScheduleSlots(typed.schedule_slots),
    startsOn: typed.starts_on != null ? String(typed.starts_on).slice(0, 10) : null,
    endsOn: typed.ends_on != null ? String(typed.ends_on).slice(0, 10) : null,
  };
}

async function resolveTrialCredit(
  admin: SupabaseClient,
  dni?: string | null,
): Promise<{ trialPaid: number; alreadyCredited: number; enabled: boolean }> {
  const none = { trialPaid: 0, alreadyCredited: 0, enabled: false };
  if (!dni?.trim()) return none;
  try {
    const [policy, credit] = await Promise.all([
      loadFamilyBillingPolicy(admin),
      loadStudentPaidTrialCredit(admin, { studentId: "", dni }),
    ]);
    if (!credit) return { ...none, enabled: policy.creditPaidTrialOnEnroll };
    return {
      trialPaid: credit.trialPaid,
      alreadyCredited: credit.alreadyCredited,
      enabled: policy.creditPaidTrialOnEnroll,
    };
  } catch {
    return none;
  }
}

type RegistrationSectionCohort = {
  enrollment_fee_mode?: string | null;
  default_enrollment_fee_amount?: number | string | null;
  default_monthly_fee?: number | string | null;
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
