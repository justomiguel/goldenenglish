import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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

  const { error } = await input.adminClient
    .from("event_payments")
    .update({
      status: "approved",
      review_notes: input.notes ?? null,
      reviewed_by: input.actorId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.paymentId);

  if (error) {
    logSupabaseClientError("approveEventPayment:update", error, { paymentId: input.paymentId });
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
  return { ok: audit.ok };
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
  return { ok: audit.ok };
}
