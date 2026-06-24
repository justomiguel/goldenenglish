import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface RevertEventPaymentApprovalInput {
  admin: SupabaseClient;
  paymentId: string;
  reviewedBy: string;
  reviewNotes?: string | null;
}

export type RevertEventPaymentApprovalResult =
  | { ok: true; paymentReverted: boolean; attendeeReverted: boolean }
  | { ok: false; code: "not_found" | "not_revertible" | "update_failed" };

async function revertConfirmedAttendeeToPendingPayment(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("event_attendees")
    .update({ status: "pending_payment" })
    .eq("id", attendeeId)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseClientError("revertEventPaymentApprovalCore:revertAttendee", error, {
      attendeeId,
    });
    return false;
  }

  return Boolean(data?.id);
}

/** Reverts a manually approved bank-transfer payment to pending and rolls the attendee back to pending_payment. */
export async function revertEventPaymentApprovalCore(
  input: RevertEventPaymentApprovalInput,
): Promise<RevertEventPaymentApprovalResult> {
  const { data: row, error: selectError } = await input.admin
    .from("event_payments")
    .select("id, status, gateway_provider, event_attendee_id")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (selectError) {
    logSupabaseClientError("revertEventPaymentApprovalCore:select", selectError, {
      paymentId: input.paymentId,
    });
    return { ok: false, code: "update_failed" };
  }

  if (!row?.id) {
    return { ok: false, code: "not_found" };
  }

  const currentStatus = String(row.status);
  const gatewayProvider = row.gateway_provider;

  if (currentStatus !== "approved" || gatewayProvider != null) {
    return { ok: false, code: "not_revertible" };
  }

  const attendeeId = String(row.event_attendee_id);

  const { data: paymentRow, error: paymentError } = await input.admin
    .from("event_payments")
    .update({
      status: "pending",
      paid_at: null,
      reviewed_by: input.reviewedBy,
      review_notes: input.reviewNotes ?? null,
    })
    .eq("id", input.paymentId)
    .eq("status", "approved")
    .is("gateway_provider", null)
    .select("id")
    .maybeSingle();

  if (paymentError) {
    logSupabaseClientError("revertEventPaymentApprovalCore:updatePayment", paymentError, {
      paymentId: input.paymentId,
    });
    return { ok: false, code: "update_failed" };
  }

  if (!paymentRow?.id) {
    return { ok: false, code: "not_revertible" };
  }

  const attendeeReverted = await revertConfirmedAttendeeToPendingPayment(input.admin, attendeeId);

  return {
    ok: true,
    paymentReverted: true,
    attendeeReverted,
  };
}
