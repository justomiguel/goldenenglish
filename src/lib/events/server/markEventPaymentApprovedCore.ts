import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type EventPaymentGatewayProvider = "flow" | "mercadopago";

export interface MarkEventPaymentApprovedInput {
  admin: SupabaseClient;
  paymentId: string;
  gatewayProvider?: EventPaymentGatewayProvider | null;
  paidAt?: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
}

export type MarkEventPaymentApprovedResult =
  | { ok: true; paymentId: string; paymentUpdated: boolean; attendeeConfirmed: boolean }
  | { ok: false; code: "not_found" | "update_failed" };

async function confirmPendingPaymentAttendee(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("event_attendees")
    .update({ status: "confirmed" })
    .eq("id", attendeeId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseClientError("markEventPaymentApprovedCore:confirmAttendee", error, {
      attendeeId,
    });
    return false;
  }

  return Boolean(data?.id);
}

/** Marks an event payment approved and promotes the attendee from pending_payment to confirmed. */
export async function markEventPaymentApprovedCore(
  input: MarkEventPaymentApprovedInput,
): Promise<MarkEventPaymentApprovedResult> {
  const { data: row, error: selectError } = await input.admin
    .from("event_payments")
    .select("id, status, event_attendee_id")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (selectError) {
    logSupabaseClientError("markEventPaymentApprovedCore:select", selectError, {
      paymentId: input.paymentId,
    });
    return { ok: false, code: "update_failed" };
  }

  if (!row?.id) {
    return { ok: false, code: "not_found" };
  }

  const attendeeId = String(row.event_attendee_id);
  const currentStatus = String(row.status);
  let paymentUpdated = false;

  if (currentStatus !== "approved") {
    const patch: Record<string, unknown> = {
      status: "approved",
      paid_at: input.paidAt ?? new Date().toISOString(),
    };
    if (input.gatewayProvider) patch.gateway_provider = input.gatewayProvider;
    if (input.reviewedBy !== undefined) patch.reviewed_by = input.reviewedBy;
    if (input.reviewNotes !== undefined) patch.review_notes = input.reviewNotes;

    const { error: updateError } = await input.admin
      .from("event_payments")
      .update(patch)
      .eq("id", input.paymentId)
      .in("status", ["pending", "rejected"]);

    if (updateError) {
      logSupabaseClientError("markEventPaymentApprovedCore:updatePayment", updateError, {
        paymentId: input.paymentId,
      });
      return { ok: false, code: "update_failed" };
    }
    paymentUpdated = true;
  }

  const attendeeConfirmed = await confirmPendingPaymentAttendee(input.admin, attendeeId);

  return {
    ok: true,
    paymentId: input.paymentId,
    paymentUpdated,
    attendeeConfirmed,
  };
}
