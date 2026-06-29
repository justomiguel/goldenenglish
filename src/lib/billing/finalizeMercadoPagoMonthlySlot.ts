import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import type { MonthlyPaymentSlotRef } from "@/lib/billing/parseMonthlyGatewayReference";
import { upsertApprovedMonthlyPaymentCore } from "@/lib/billing/upsertApprovedMonthlyPaymentCore";
import { upsertMpFinalizeRecord } from "@/lib/billing/upsertMpFinalizeRecord";
import { notifyAndRevalidateMonthlyApproval } from "@/lib/billing/notifyAndRevalidateMonthlyApproval";
import { resolveUserLocale } from "@/lib/i18n/resolveUserLocale";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";

export type FinalizeMonthlySlotResult = {
  ok: boolean;
  skipped?: string;
  approved?: boolean;
  paymentId?: string;
};

/**
 * Deferred-creation finalize for a MercadoPago monthly checkout: materializes and
 * approves the `payments` row from the slot reference, then runs MP-specific
 * aftermath (finalize record + analytics) and shared notifications.
 */
export async function finalizeMercadoPagoMonthlySlot(input: {
  admin: SupabaseClient;
  slot: MonthlyPaymentSlotRef;
  snapshot: MercadoPagoPaymentPayload;
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
    gatewayProvider: "mercadopago",
    gatewayAmount: snapshot.transaction_amount,
    gatewayCurrency: snapshot.currency_id,
    source: "mercadopago",
    gatewayPaymentRef: snapshot.id,
    mpPreferenceId: null,
  });

  if (!result.ok) return { ok: false };
  if ("skipped" in result) return { ok: true, skipped: result.skipped };

  await upsertMpFinalizeRecord({
    admin,
    paymentId: result.paymentId,
    preferenceId: String(snapshot.id),
    snapshot,
  });

  if (!result.alreadyApproved) {
    void admin.from("user_events").insert({
      user_id: result.studentId,
      event_type: "action" as const,
      entity: AnalyticsEntity.monthlyPaymentMercadoPagoCompleted,
      metadata: sanitizeAnalyticsMetadata({
        month: result.month,
        year: result.year,
        section_id: result.sectionId,
        mp_payment_id: String(snapshot.id),
        payment_id: result.paymentId,
      }),
    });

    const loc = await resolveUserLocale(admin, result.studentId);
    notifyAndRevalidateMonthlyApproval({
      studentId: result.studentId,
      month: result.month,
      year: result.year,
      amount: result.amount,
      currency: result.currency,
      locale: loc,
    });
  }

  return { ok: true, approved: true, paymentId: result.paymentId };
}
