import { applyTrialCreditToPayableLines } from "@/lib/billing/applyTrialCreditToPayableLines";
import { listPayableParentMonthSections } from "@/lib/billing/listPayableParentMonthSections";
import { resolveParentMonthlyPayScope } from "@/lib/billing/resolveParentMonthlyPayScope";
import { assertParentMonthlyReviewSnapshot } from "@/lib/billing/assertParentMonthlyReviewSnapshot";
import type { FamilyBillingPolicy } from "@/lib/billing/familyBillingPolicy";
import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";
import type { StudentPaidTrialCredit } from "@/lib/billing/loadStudentPaidTrialCredit";

export type ComputedParentMonthlyReviewCharge =
  | { ok: false; reason: "stale" }
  | {
      ok: true;
      scope: ParentMonthlyPayScope;
      lines: PayableParentMonthLine[];
      total: number;
      currency: string;
      trialCreditApplied: number;
      trialCreditRegistrationId: string | null;
    };

export function computeParentMonthlyReviewCharge(input: {
  view: StudentMonthlyPaymentsView;
  originSectionId: string;
  month: number;
  year: number;
  requestedScope: ParentMonthlyPayScope;
  submittedTotal: number;
  policy: FamilyBillingPolicy;
  trialCredit: StudentPaidTrialCredit | null;
}): ComputedParentMonthlyReviewCharge {
  const allLines = listPayableParentMonthSections({
    view: input.view,
    originSectionId: input.originSectionId,
    month: input.month,
    year: input.year,
    scope: "all",
    useFullMonthAmount: true,
  });
  const scope = resolveParentMonthlyPayScope({
    requested: input.requestedScope,
    allowPartial: input.policy.allowParentPartialSectionPayments,
    payableSectionCount: allLines.lines.length,
  });
  const payable = listPayableParentMonthSections({
    view: input.view,
    originSectionId: input.originSectionId,
    month: input.month,
    year: input.year,
    scope,
    useFullMonthAmount: true,
  });
  if (payable.lines.length === 0 || !payable.currency) {
    return { ok: false, reason: "stale" };
  }

  const available = input.trialCredit
    ? Math.max(0, input.trialCredit.trialPaid - input.trialCredit.alreadyCredited)
    : 0;
  const adjusted = applyTrialCreditToPayableLines({
    lines: payable.lines,
    creditAvailable: available,
    enabled: input.policy.creditPaidTrialOnEnroll,
  });
  const payableLines = adjusted.lines.filter((line) => line.amount > 0);
  const total = payableLines.reduce((sum, line) => sum + line.amount, 0);
  const currency = payable.currency;

  if (total > 0) {
    if (
      !assertParentMonthlyReviewSnapshot({
        computedTotal: total,
        submittedTotal: input.submittedTotal,
        currency,
      })
    ) {
      return { ok: false, reason: "stale" };
    }
    if (payableLines.length === 0) return { ok: false, reason: "stale" };
  } else if (input.submittedTotal !== 0) {
    return { ok: false, reason: "stale" };
  }

  return {
    ok: true,
    scope,
    lines: total > 0 ? payableLines : adjusted.lines,
    total,
    currency,
    trialCreditApplied: adjusted.creditApplied,
    trialCreditRegistrationId: input.trialCredit?.registrationId ?? null,
  };
}
