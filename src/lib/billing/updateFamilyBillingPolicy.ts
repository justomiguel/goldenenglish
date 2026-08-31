import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
  CREDIT_PAID_TRIAL_ON_ENROLL_KEY,
} from "@/lib/billing/familyBillingPolicy";

export type UpdateFamilyBillingPolicyResult = { ok: true } | { ok: false; error: "db_error" };

export async function updateFamilyBillingPolicy(
  supabase: SupabaseClient,
  input: {
    creditPaidTrialOnEnroll: boolean;
    allowParentPartialSectionPayments: boolean;
  },
): Promise<UpdateFamilyBillingPolicyResult> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("site_settings").upsert(
    [
      {
        key: CREDIT_PAID_TRIAL_ON_ENROLL_KEY,
        value: input.creditPaidTrialOnEnroll,
        updated_at: now,
      },
      {
        key: ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
        value: input.allowParentPartialSectionPayments,
        updated_at: now,
      },
    ],
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: "db_error" };
  return { ok: true };
}
