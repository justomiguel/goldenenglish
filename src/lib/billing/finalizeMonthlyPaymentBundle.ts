import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { upsertApprovedMonthlyPaymentCore } from "@/lib/billing/upsertApprovedMonthlyPaymentCore";
import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FinalizeMonthlyBundleResult =
  | { ok: true; approved: true; paymentId: string; paymentIds: string[] }
  | { ok: true; skipped: string }
  | { ok: false };

export async function finalizeMonthlyPaymentBundle(input: {
  admin: SupabaseClient;
  bundle: {
    studentId: string;
    parentId: string | null;
    year: number;
    month: number;
    sectionIds: string[];
  };
  gatewayAmount: number;
  gatewayCurrency: string;
  gatewayProvider: "flow" | "mercadopago";
  source: string;
  gatewayPaymentRef?: string | number | null;
  mpPreferenceId?: string | null;
}): Promise<FinalizeMonthlyBundleResult> {
  const curGateway = input.gatewayCurrency.trim().toUpperCase();
  const plans: { sectionId: string; amount: number; currency: string }[] = [];

  for (const sectionId of input.bundle.sectionIds) {
    const plan = await resolveSectionPlanMonthlyAmount(
      input.admin,
      input.bundle.studentId,
      sectionId,
      input.bundle.year,
      input.bundle.month,
    );
    if (plan.code !== "ok" || plan.amount <= 0) {
      logServerActionInvariantViolation(
        "finalizeMonthlyPaymentBundle:plan",
        plan.code !== "ok" ? plan.code : "zero",
        { section_id: sectionId },
      );
      return { ok: true, skipped: "amount_mismatch" };
    }
    if (plan.currency.trim().toUpperCase() !== curGateway) {
      return { ok: true, skipped: "currency_mismatch" };
    }
    plans.push({ sectionId, amount: plan.amount, currency: plan.currency });
  }

  const sum = plans.reduce((acc, p) => acc + p.amount, 0);
  if (!amountsMatchForCurrency(sum, input.gatewayAmount, curGateway)) {
    logServerActionInvariantViolation(
      "finalizeMonthlyPaymentBundle:amount_mismatch",
      `${sum} vs ${input.gatewayAmount}`,
      { student_id: input.bundle.studentId },
    );
    return { ok: true, skipped: "amount_mismatch" };
  }

  const paymentIds: string[] = [];
  for (const plan of plans) {
    const result = await upsertApprovedMonthlyPaymentCore({
      admin: input.admin,
      slot: {
        studentId: input.bundle.studentId,
        sectionId: plan.sectionId,
        month: input.bundle.month,
        year: input.bundle.year,
        parentId: input.bundle.parentId,
      },
      gatewayProvider: input.gatewayProvider,
      gatewayAmount: plan.amount,
      gatewayCurrency: plan.currency,
      source: input.source,
      gatewayPaymentRef: input.gatewayPaymentRef,
      mpPreferenceId: input.mpPreferenceId,
    });
    if (!result.ok) return { ok: false };
    if ("skipped" in result) return { ok: true, skipped: result.skipped };
    paymentIds.push(result.paymentId);
  }

  const first = paymentIds[0];
  if (!first) return { ok: true, skipped: "empty_bundle" };
  return { ok: true, approved: true, paymentId: first, paymentIds };
}
