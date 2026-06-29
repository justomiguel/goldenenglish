import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  markEventPaymentApprovedCore,
  type EventPaymentGatewayProvider,
} from "@/lib/events/server/markEventPaymentApprovedCore";
import { loadEventAttendeeGatewayContext } from "@/lib/events/server/loadEventAttendeeGatewayContext";

export interface UpsertApprovedEventGatewayPaymentInput {
  admin: SupabaseClient;
  attendeeId: string;
  gatewayProvider: EventPaymentGatewayProvider;
  paidAt?: string;
  mpPreferenceId?: string | null;
}

export type UpsertApprovedEventGatewayPaymentResult =
  | { ok: true; paymentId: string }
  | { ok: true; skipped: "event_attendee_not_found" }
  | { ok: false };

interface ExistingPaymentRow {
  id: string;
  status: string;
}

async function loadExistingPayment(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<ExistingPaymentRow | null | undefined> {
  const { data, error } = await admin
    .from("event_payments")
    .select("id, status")
    .eq("event_attendee_id", attendeeId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("upsertApprovedEventGatewayPaymentCore:loadExisting", error, {
      attendeeId,
    });
    return undefined;
  }

  return (data as ExistingPaymentRow | null) ?? null;
}

/**
 * Ensures an approved event payment exists for a gateway-confirmed attendee.
 *
 * Implements the deferred-creation contract: the payment row is materialized (or flipped
 * to approved) only after the gateway confirms payment, then the attendee is promoted to
 * confirmed. Idempotent against duplicate webhook deliveries via the unique
 * `event_payments.event_attendee_id` constraint.
 */
export async function upsertApprovedEventGatewayPaymentCore(
  input: UpsertApprovedEventGatewayPaymentInput,
): Promise<UpsertApprovedEventGatewayPaymentResult> {
  let existing = await loadExistingPayment(input.admin, input.attendeeId);
  if (existing === undefined) return { ok: false };

  let paymentId = existing?.id ?? "";

  if (!paymentId) {
    const context = await loadEventAttendeeGatewayContext(input.admin, input.attendeeId);
    if (!context) return { ok: true, skipped: "event_attendee_not_found" };

    const { data: inserted, error: insertError } = await input.admin
      .from("event_payments")
      .insert({
        event_attendee_id: input.attendeeId,
        amount: context.amount,
        currency: context.currency,
        status: "pending",
        gateway_provider: input.gatewayProvider,
        mp_preference_id: input.mpPreferenceId ?? null,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      // A concurrent webhook may have created the row first (unique attendee constraint).
      const raced = await loadExistingPayment(input.admin, input.attendeeId);
      if (raced === undefined || !raced?.id) {
        logSupabaseClientError("upsertApprovedEventGatewayPaymentCore:insert", insertError, {
          attendeeId: input.attendeeId,
        });
        return { ok: false };
      }
      existing = raced;
      paymentId = raced.id;
    } else {
      paymentId = String(inserted?.id ?? "");
    }
  }

  if (!paymentId) return { ok: false };

  const approved = await markEventPaymentApprovedCore({
    admin: input.admin,
    paymentId,
    gatewayProvider: input.gatewayProvider,
    paidAt: input.paidAt,
  });

  if (!approved.ok) return { ok: false };

  if (input.mpPreferenceId) {
    await input.admin
      .from("event_payments")
      .update({ mp_preference_id: input.mpPreferenceId })
      .eq("id", paymentId)
      .is("mp_preference_id", null);
  }

  return { ok: true, paymentId };
}
