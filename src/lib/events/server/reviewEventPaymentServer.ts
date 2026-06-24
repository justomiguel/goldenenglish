import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { markEventPaymentApprovedCore } from "@/lib/events/server/markEventPaymentApprovedCore";
import { revertEventPaymentApprovalCore } from "@/lib/events/server/revertEventPaymentApprovalCore";

export async function approveEventPayment(input: {
  adminClient: SupabaseClient;
  actorId: string;
  paymentId: string;
  notes?: string | null;
}): Promise<{ ok: boolean }> {
  const { data: beforeRow } = await input.adminClient
    .from("event_payments")
    .select("status, review_notes")
    .eq("id", input.paymentId)
    .maybeSingle();

  const approved = await markEventPaymentApprovedCore({
    admin: input.adminClient,
    paymentId: input.paymentId,
    reviewedBy: input.actorId,
    reviewNotes: input.notes ?? null,
  });

  if (!approved.ok) {
    return { ok: false };
  }

  const audit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "approve",
    resourceType: "event_payment",
    resourceId: input.paymentId,
    summary: "Admin approved an event payment",
    beforeValues: beforeRow ?? {},
    afterValues: { status: "approved", review_notes: input.notes ?? null },
    metadata: { payment_id: input.paymentId },
  });

  if (!audit.ok) {
    logServerWarn("approveEventPayment:audit_failed", { payment_id: input.paymentId });
  }

  return { ok: true };
}

export async function rejectEventPayment(input: {
  adminClient: SupabaseClient;
  actorId: string;
  paymentId: string;
  notes: string;
}): Promise<{ ok: boolean }> {
  const { data: beforeRow } = await input.adminClient
    .from("event_payments")
    .select("status, review_notes")
    .eq("id", input.paymentId)
    .maybeSingle();

  const { error } = await input.adminClient
    .from("event_payments")
    .update({
      status: "rejected",
      review_notes: input.notes,
      reviewed_by: input.actorId,
    })
    .eq("id", input.paymentId);

  if (error) {
    logSupabaseClientError("rejectEventPayment:update", error, { paymentId: input.paymentId });
    return { ok: false };
  }

  const audit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "reject",
    resourceType: "event_payment",
    resourceId: input.paymentId,
    summary: "Admin rejected an event payment",
    beforeValues: beforeRow ?? {},
    afterValues: { status: "rejected", review_notes: input.notes },
    metadata: { payment_id: input.paymentId },
  });

  if (!audit.ok) {
    logServerWarn("rejectEventPayment:audit_failed", { payment_id: input.paymentId });
  }

  return { ok: true };
}

export async function revertEventPaymentApproval(input: {
  adminClient: SupabaseClient;
  actorId: string;
  paymentId: string;
  notes?: string | null;
}): Promise<{ ok: boolean; code?: "not_revertible" | "not_found" | "update_failed" }> {
  const { data: beforeRow } = await input.adminClient
    .from("event_payments")
    .select("status, review_notes, event_attendee_id")
    .eq("id", input.paymentId)
    .maybeSingle();

  const reverted = await revertEventPaymentApprovalCore({
    admin: input.adminClient,
    paymentId: input.paymentId,
    reviewedBy: input.actorId,
    reviewNotes: input.notes ?? null,
  });

  if (!reverted.ok) {
    return { ok: false, code: reverted.code };
  }

  const audit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "update",
    resourceType: "event_payment",
    resourceId: input.paymentId,
    summary: "Admin reverted an approved event payment to pending review",
    beforeValues: beforeRow ?? {},
    afterValues: { status: "pending", review_notes: input.notes ?? null },
    metadata: {
      payment_id: input.paymentId,
      attendee_id: beforeRow?.event_attendee_id ?? null,
      attendee_reverted: reverted.attendeeReverted,
    },
  });

  if (!audit.ok) {
    logServerWarn("revertEventPaymentApproval:audit_failed", { payment_id: input.paymentId });
  }

  return { ok: true };
}
