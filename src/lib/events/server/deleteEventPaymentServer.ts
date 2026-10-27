import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { releaseSeatsForAttendee } from "@/lib/events/server/eventSeatLocksServer";
import { releaseEventDiscountRedemption } from "@/lib/events/server/syncEventDiscountRedemption";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/server/uploadEventAttendeeFileServer";

type DeleteEventPaymentCode = "not_found" | "not_deletable" | "delete_failed";

interface PaymentDeleteRow {
  id: string;
  status: string;
  amount: number;
  currency: string;
  gateway_provider: string | null;
  receipt_storage_path: string | null;
  event_attendee_id: string;
  event_attendees: {
    id: string;
    status: string;
    event_id: string;
  };
}

function parseAttendee(raw: PaymentDeleteRow["event_attendees"] | PaymentDeleteRow["event_attendees"][]) {
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function deleteEventPayment(input: {
  adminClient: SupabaseClient;
  actorId: string;
  paymentId: string;
  eventId?: string;
}): Promise<{ ok: boolean; code?: DeleteEventPaymentCode }> {
  const { data, error: loadError } = await input.adminClient
    .from("event_payments")
    .select(
      "id, status, amount, currency, gateway_provider, receipt_storage_path, event_attendee_id, event_attendees!inner(id, status, event_id)",
    )
    .eq("id", input.paymentId)
    .maybeSingle();

  if (loadError) {
    logSupabaseClientError("deleteEventPayment:load", loadError, { paymentId: input.paymentId });
    return { ok: false, code: "not_found" };
  }

  const row = data as PaymentDeleteRow | null;
  if (!row) return { ok: false, code: "not_found" };

  const attendee = parseAttendee(row.event_attendees);
  if (!attendee) return { ok: false, code: "not_found" };

  if (input.eventId && attendee.event_id !== input.eventId) {
    return { ok: false, code: "not_found" };
  }

  if (row.gateway_provider) {
    return { ok: false, code: "not_deletable" };
  }

  if (row.status !== "pending" && row.status !== "rejected" && row.status !== "approved") {
    return { ok: false, code: "not_deletable" };
  }

  const receiptPath = row.receipt_storage_path?.trim();
  if (receiptPath && !receiptPath.includes("..")) {
    const { error: storageError } = await input.adminClient.storage
      .from(EVENT_UPLOADS_BUCKET)
      .remove([receiptPath]);
    if (storageError) {
      logSupabaseClientError("deleteEventPayment:storage", storageError, {
        paymentId: input.paymentId,
        path: receiptPath,
      });
    }
  }

  const { error: deleteError } = await input.adminClient
    .from("event_payments")
    .delete()
    .eq("id", input.paymentId);

  if (deleteError) {
    logSupabaseClientError("deleteEventPayment:delete", deleteError, { paymentId: input.paymentId });
    return { ok: false, code: "delete_failed" };
  }

  const removed = await removePurchaseAttendees(input.adminClient, attendee.id);
  if (!removed) return { ok: false, code: "delete_failed" };

  const audit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "delete",
    resourceType: "event_payment",
    resourceId: input.paymentId,
    summary: "Admin deleted an event bank-transfer payment record",
    beforeValues: {
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      receipt_storage_path: row.receipt_storage_path,
      event_attendee_id: row.event_attendee_id,
    },
    afterValues: {},
    metadata: {
      payment_id: input.paymentId,
      event_id: attendee.event_id,
      attendee_id: attendee.id,
      source: "event_payment_admin_delete",
    },
  });

  return { ok: audit.ok };
}

/** The holder and every companion leave the attendee list with the payment. */
async function removePurchaseAttendees(admin: SupabaseClient, attendeeId: string): Promise<boolean> {
  await releaseSeatsForAttendee(admin, attendeeId);
  await releaseEventDiscountRedemption(admin, attendeeId);

  const companions = await admin.from("event_attendees").delete().eq("primary_attendee_id", attendeeId);
  if (companions.error) {
    logSupabaseClientError("deleteEventPayment:deleteCompanions", companions.error, { attendeeId });
    return false;
  }

  const holder = await admin.from("event_attendees").delete().eq("id", attendeeId);
  if (holder.error) {
    logSupabaseClientError("deleteEventPayment:deleteHolder", holder.error, { attendeeId });
    return false;
  }
  return true;
}
