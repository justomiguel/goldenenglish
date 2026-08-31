import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
  CREDIT_PAID_TRIAL_ON_ENROLL_KEY,
  familyBillingPolicyFromRows,
  type FamilyBillingPolicy,
} from "@/lib/billing/familyBillingPolicy";

export async function loadFamilyBillingPolicy(
  supabase: SupabaseClient,
): Promise<FamilyBillingPolicy> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [CREDIT_PAID_TRIAL_ON_ENROLL_KEY, ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY]);
  return familyBillingPolicyFromRows(data ?? []);
}
