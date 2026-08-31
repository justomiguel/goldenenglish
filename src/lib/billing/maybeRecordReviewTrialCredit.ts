import type { SupabaseClient } from "@supabase/supabase-js";
import { recordTrialCreditApplied } from "@/lib/billing/recordTrialCreditApplied";

export async function maybeRecordReviewTrialCredit(input: {
  admin: SupabaseClient;
  registrationId: string | null;
  applied: number;
}): Promise<void> {
  if (!input.registrationId || !(input.applied > 0)) return;
  await recordTrialCreditApplied({
    admin: input.admin,
    registrationId: input.registrationId,
    applied: input.applied,
  });
}
