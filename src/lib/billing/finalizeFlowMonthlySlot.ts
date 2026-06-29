import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlowStatusPayload } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import type { MonthlyPaymentSlotRef } from "@/lib/billing/parseMonthlyGatewayReference";
import type { FinalizeMonthlySlotResult } from "@/lib/billing/finalizeMercadoPagoMonthlySlot";
import { upsertApprovedMonthlyPaymentCore } from "@/lib/billing/upsertApprovedMonthlyPaymentCore";
import { upsertFlowFinalizeRecord } from "@/lib/billing/upsertFlowFinalizeRecord";
import { notifyAndRevalidateMonthlyApproval } from "@/lib/billing/notifyAndRevalidateMonthlyApproval";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";

/**
 * Deferred-creation finalize for a Flow.cl monthly checkout: materializes and
 * approves the `payments` row from the slot reference, persists the Flow finalize
 * record, and runs shared notifications.
 */
export async function finalizeFlowMonthlySlot(input: {
  admin: SupabaseClient;
  slot: MonthlyPaymentSlotRef;
  snapshot: FlowStatusPayload;
}): Promise<FinalizeMonthlySlotResult> {
  const { admin, slot, snapshot } = input;

  const result = await upsertApprovedMonthlyPaymentCore({
    admin,
    slot: {
      studentId: slot.studentId,
      sectionId: slot.sectionId,
      month: slot.month,
      year: slot.year,
      parentId: slot.parentId,
    },
    gatewayProvider: "flow",
    gatewayAmount: snapshot.amount,
    gatewayCurrency: snapshot.currency,
    source: "flow_cl",
    gatewayPaymentRef: snapshot.flowOrder,
  });

  if (!result.ok) return { ok: false };
  if ("skipped" in result) return { ok: true, skipped: result.skipped };

  await upsertFlowFinalizeRecord({
    admin,
    paymentId: result.paymentId,
    snapshot,
  });

  if (!result.alreadyApproved) {
    notifyAndRevalidateMonthlyApproval({
      studentId: result.studentId,
      month: result.month,
      year: result.year,
      amount: result.amount,
      currency: result.currency,
      locale: defaultLocale as Locale,
    });
  }

  return { ok: true, approved: true, paymentId: result.paymentId };
}
