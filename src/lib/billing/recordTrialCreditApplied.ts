import type { SupabaseClient } from "@supabase/supabase-js";
import { withTrialCreditRecorded } from "@/lib/billing/parseTrialFeeCreditSnapshot";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function recordTrialCreditApplied(input: {
  admin: SupabaseClient;
  registrationId: string;
  applied: number;
}): Promise<{ ok: boolean }> {
  if (!(input.applied > 0) || !input.registrationId) return { ok: true };
  const { data, error } = await input.admin
    .from("registrations")
    .select("trial_fee_snapshot")
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("recordTrialCreditApplied:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  const next = withTrialCreditRecorded(data?.trial_fee_snapshot, input.applied);
  const { error: upErr } = await input.admin
    .from("registrations")
    .update({ trial_fee_snapshot: next })
    .eq("id", input.registrationId);
  if (upErr) {
    logSupabaseClientError("recordTrialCreditApplied:update", upErr, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  return { ok: true };
}
