import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEventPaymentReceiptPath } from "@/lib/events/buildEventPaymentReceiptPath";
import {
  normalizeEventRegistrationDni,
  normalizeEventRegistrationEmail,
  validateEventTransferReceiptFile,
} from "@/lib/events/eventTransferReceiptLimits";
import {
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/server/uploadEventAttendeeFileServer";
import { loadEventAttendeeGatewayContext } from "@/lib/events/server/loadEventAttendeeGatewayContext";

export interface UploadEventPaymentReceiptServerInput {
  slug: string;
  attendeeId: string;
  email: string;
  dniOrPassport: string;
  fileName: string;
  fileBytes: Buffer;
  fileMime: string;
  uploadedByUserId?: string | null;
}

export type UploadEventPaymentReceiptServerResult =
  | { ok: true; path: string }
  | {
      ok: false;
      code:
        | "invalid_file"
        | "payment_not_found"
        | "identity_mismatch"
        | "receipt_already_uploaded"
        | "payment_not_pending"
        | "storage_failed"
        | "update_failed";
    };

interface ExistingReceiptPaymentRow {
  id: string;
  status: string;
  receipt_storage_path: string | null;
}

async function loadExistingPayment(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<ExistingReceiptPaymentRow | null | undefined> {
  const { data, error } = await admin
    .from("event_payments")
    .select("id, status, receipt_storage_path")
    .eq("event_attendee_id", attendeeId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("uploadEventPaymentReceiptServer:loadExisting", error, { attendeeId });
    return undefined;
  }

  return (data as ExistingReceiptPaymentRow | null) ?? null;
}

/**
 * Materializes (or attaches a receipt to) a bank-transfer event payment.
 *
 * Deferred-creation flow: the payment row is created as `pending` only when the attendee
 * uploads a receipt, so abandoned online checkouts never produce a payment record. Idempotent
 * against the unique `event_payments.event_attendee_id` constraint.
 */
export async function uploadEventPaymentReceiptServer(
  input: UploadEventPaymentReceiptServerInput,
): Promise<UploadEventPaymentReceiptServerResult> {
  const validated = validateEventTransferReceiptFile({
    size: input.fileBytes.byteLength,
    type: input.fileMime,
  });
  if (!validated.ok) {
    logServerWarn("events.uploadPaymentReceipt", {
      reason: "invalid_file",
      code: validated.code,
      attendeeId: input.attendeeId,
    });
    return { ok: false, code: "invalid_file" };
  }

  const admin = createAdminClient();
  const context = await loadEventAttendeeGatewayContext(admin, input.attendeeId);
  if (!context) {
    return { ok: false, code: "payment_not_found" };
  }

  if (context.slug !== input.slug) {
    return { ok: false, code: "payment_not_found" };
  }

  const emailOk =
    normalizeEventRegistrationEmail(context.email) ===
    normalizeEventRegistrationEmail(input.email);
  const dniOk =
    normalizeEventRegistrationDni(context.dniOrPassport) ===
    normalizeEventRegistrationDni(input.dniOrPassport);

  if (!emailOk || !dniOk) {
    logServerWarn("events.uploadPaymentReceipt", {
      reason: "identity_mismatch",
      attendeeId: input.attendeeId,
      eventId: context.eventId,
    });
    return { ok: false, code: "identity_mismatch" };
  }

  if (context.attendeeStatus !== "pending_payment") {
    return { ok: false, code: "payment_not_pending" };
  }

  const existing = await loadExistingPayment(admin, input.attendeeId);
  if (existing === undefined) {
    return { ok: false, code: "update_failed" };
  }
  if (existing) {
    if (existing.receipt_storage_path) {
      return { ok: false, code: "receipt_already_uploaded" };
    }
    if (existing.status !== "pending") {
      return { ok: false, code: "payment_not_pending" };
    }
  }

  const path = buildEventPaymentReceiptPath({
    eventId: context.eventId,
    attendeeId: context.attendeeId,
    filename: input.fileName,
    mime: validated.mime,
  });

  const { error: uploadError } = await admin.storage
    .from(EVENT_UPLOADS_BUCKET)
    .upload(path, input.fileBytes, {
      contentType: validated.mime,
      upsert: false,
    });

  if (uploadError) {
    logSupabaseClientError("uploadEventPaymentReceiptServer:storage", uploadError, {
      attendeeId: input.attendeeId,
      path,
    });
    return { ok: false, code: "storage_failed" };
  }

  const writeError = existing
    ? (
        await admin
          .from("event_payments")
          .update({
            receipt_storage_path: path,
            receipt_uploaded_by: input.uploadedByUserId ?? null,
          })
          .eq("id", existing.id)
          .eq("status", "pending")
          .is("receipt_storage_path", null)
      ).error
    : (
        await admin.from("event_payments").insert({
          event_attendee_id: context.attendeeId,
          amount: context.amount,
          currency: context.currency,
          status: "pending",
          receipt_storage_path: path,
          receipt_uploaded_by: input.uploadedByUserId ?? null,
        })
      ).error;

  if (writeError) {
    logSupabaseClientError("uploadEventPaymentReceiptServer:write", writeError, {
      attendeeId: input.attendeeId,
      path,
    });
    await admin.storage.from(EVENT_UPLOADS_BUCKET).remove([path]);
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, path };
}
