import type { SupabaseClient } from "@supabase/supabase-js";
import { recordOnePaymentWithoutReceipt } from "@/lib/billing/recordPaymentWithoutReceiptCore";
import { maybeRecordReviewTrialCredit } from "@/lib/billing/maybeRecordReviewTrialCredit";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";

export async function settleParentMonthlyReviewByTrialCredit(input: {
  admin: SupabaseClient;
  studentId: string;
  month: number;
  year: number;
  lines: PayableParentMonthLine[];
  trialCreditApplied: number;
  trialCreditRegistrationId: string | null;
  actorId: string;
}): Promise<{ ok: true } | { ok: false; code: "save_failed" }> {
  if (!(input.trialCreditApplied > 0) || input.lines.length === 0) {
    return { ok: false, code: "save_failed" };
  }
  const correlationId = `trial-credit-${input.studentId}-${input.year}-${input.month}`;
  for (const line of input.lines) {
    const recorded = await recordOnePaymentWithoutReceipt(input.admin, {
      studentId: input.studentId,
      sectionId: line.sectionId,
      year: input.year,
      month: input.month,
      adminNote: "trial_credit",
      actorId: input.actorId,
      correlationId,
    });
    if (!recorded.success && recorded.code !== "already_approved") {
      return { ok: false, code: "save_failed" };
    }
  }
  await maybeRecordReviewTrialCredit({
    admin: input.admin,
    registrationId: input.trialCreditRegistrationId,
    applied: input.trialCreditApplied,
  });
  return { ok: true };
}
