import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import {
  auditNewMonthlyGatewayPayment,
  promoteExistingMonthlyGatewayPayment,
} from "@/lib/billing/promoteExistingMonthlyGatewayPayment";
import {
  findExistingMonthlyPaymentForSlot,
  isUniqueViolation,
  amountsMatchForCurrency,
  type UpsertApprovedMonthlyPaymentInput,
  type UpsertApprovedMonthlyPaymentResult,
} from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type {
  UpsertApprovedMonthlyPaymentInput,
  UpsertApprovedMonthlyPaymentResult,
} from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";

/**
 * Idempotently materializes and approves the monthly `payments` row for a
 * gateway-confirmed checkout (deferred creation). When no row exists yet it is
 * inserted directly as `approved`; an existing `pending`/`rejected` row (e.g. a
 * transfer receipt that was also paid online) is promoted to `approved`. The
 * authoritative amount/currency come from the section fee plan and must match
 * what the gateway charged. Finance audit is written here with rollback so no
 * "payment without audit" orphan can exist (rule 19).
 */
export async function upsertApprovedMonthlyPaymentCore(
  input: UpsertApprovedMonthlyPaymentInput,
): Promise<UpsertApprovedMonthlyPaymentResult> {
  const { admin, slot } = input;
  const { studentId, month, year } = slot;
  const sectionId = slot.sectionId;
  if (!sectionId) return { ok: true, skipped: "no_section_id" };

  const plan = await resolveSectionPlanMonthlyAmount(
    admin,
    studentId,
    sectionId,
    year,
    month,
  );
  if (plan.code !== "ok") return { ok: true, skipped: `plan_${plan.code}` };

  const curPlan = plan.currency.trim().toUpperCase();
  const curGateway = input.gatewayCurrency.trim().toUpperCase();
  if (curPlan !== curGateway) return { ok: true, skipped: "currency_mismatch" };
  if (!amountsMatchForCurrency(plan.amount, input.gatewayAmount, curPlan)) {
    return { ok: true, skipped: "amount_mismatch" };
  }

  const noteLabel = input.gatewayProvider === "flow" ? "flow.cl" : "mercadopago";
  const promoteInput = {
    admin,
    studentId,
    sectionId,
    month,
    year,
    gatewayAmount: input.gatewayAmount,
    gatewayProvider: input.gatewayProvider,
    source: input.source,
    gatewayPaymentRef: input.gatewayPaymentRef,
    parentId: slot.parentId,
    noteLabel,
    planCurrency: plan.currency,
  };

  const approvedResult = (
    paymentId: string,
    alreadyApproved: boolean,
  ): UpsertApprovedMonthlyPaymentResult => ({
    ok: true,
    approved: true,
    paymentId,
    studentId,
    sectionId,
    month,
    year,
    amount: input.gatewayAmount,
    currency: plan.currency,
    alreadyApproved,
  });

  const existing = await findExistingMonthlyPaymentForSlot(
    admin,
    studentId,
    sectionId,
    month,
    year,
  );
  if (existing.error) {
    logSupabaseClientError("upsertApprovedMonthlyPaymentCore:select", existing.error, {
      studentId,
    });
    return { ok: false };
  }
  if (existing.row) {
    return promoteExistingMonthlyGatewayPayment({ ...promoteInput, row: existing.row });
  }

  const { data: created, error: insErr } = await admin
    .from("payments")
    .insert({
      student_id: studentId,
      section_id: sectionId,
      month,
      year,
      amount: input.gatewayAmount,
      status: "approved",
      admin_notes: noteLabel,
      gateway_provider: input.gatewayProvider,
      ...(slot.parentId ? { parent_id: slot.parentId } : {}),
      ...(input.mpPreferenceId ? { mp_preference_id: input.mpPreferenceId } : {}),
    })
    .select("id")
    .single();

  if (insErr) {
    if (isUniqueViolation(insErr)) {
      const raced = await findExistingMonthlyPaymentForSlot(
        admin,
        studentId,
        sectionId,
        month,
        year,
      );
      if (raced.error || !raced.row) {
        logSupabaseClientError("upsertApprovedMonthlyPaymentCore:insert", insErr, {
          studentId,
        });
        return { ok: false };
      }
      return promoteExistingMonthlyGatewayPayment({ ...promoteInput, row: raced.row });
    }
    logSupabaseClientError("upsertApprovedMonthlyPaymentCore:insert", insErr, {
      studentId,
    });
    return { ok: false };
  }

  const paymentId = created?.id as string | undefined;
  if (!paymentId) return { ok: false };

  const audited = await auditNewMonthlyGatewayPayment(promoteInput, paymentId);
  if (!audited) {
    await admin.from("payments").delete().eq("id", paymentId);
    return { ok: false };
  }
  return approvedResult(paymentId, false);
}
