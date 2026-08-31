import { parseTrialFeeCreditSnapshot } from "@/lib/billing/parseTrialFeeCreditSnapshot";

export function trialConvertCreditInput(
  lead: { trial_fee_captured?: unknown; trial_fee_snapshot?: unknown },
  creditEnabled: boolean,
): {
  trialPaid: number;
  trialAlreadyCredited: number;
  creditEnabled: boolean;
} {
  const parsed = parseTrialFeeCreditSnapshot(
    lead.trial_fee_snapshot,
    lead.trial_fee_captured === true,
  );
  return {
    trialPaid: parsed.trialPaid,
    trialAlreadyCredited: parsed.alreadyCredited,
    creditEnabled,
  };
}
