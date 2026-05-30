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

export interface UploadEventPaymentReceiptServerInput {
  slug: string;
  paymentId: string;
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

interface PaymentVerificationRow {
  id: string;
  status: string;
  receipt_storage_path: string | null;
  event_attendees: {
    id: string;
    email: string;
    dni_or_passport: string;
    event_id: string;
    events: { slug: string };
  };
}

async function loadPaymentForVerification(
  admin: SupabaseClient,
  paymentId: string,
): Promise<PaymentVerificationRow | null> {
  const { data, error } = await admin
    .from("event_payments")
    .select(
      "id, status, receipt_storage_path, event_attendees!inner(id, email, dni_or_passport, event_id, events!inner(slug))",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("uploadEventPaymentReceiptServer:loadPayment", error, {
      paymentId,
    });
    return null;
  }

  return (data as PaymentVerificationRow | null) ?? null;
}

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
      paymentId: input.paymentId,
    });
    return { ok: false, code: "invalid_file" };
  }

  const admin = createAdminClient();
  const payment = await loadPaymentForVerification(admin, input.paymentId);
  if (!payment) {
    return { ok: false, code: "payment_not_found" };
  }

  const attendee = payment.event_attendees;
  if (attendee.events.slug !== input.slug) {
    return { ok: false, code: "payment_not_found" };
  }

  const emailOk =
    normalizeEventRegistrationEmail(attendee.email) ===
    normalizeEventRegistrationEmail(input.email);
  const dniOk =
    normalizeEventRegistrationDni(attendee.dni_or_passport) ===
    normalizeEventRegistrationDni(input.dniOrPassport);

  if (!emailOk || !dniOk) {
    logServerWarn("events.uploadPaymentReceipt", {
      reason: "identity_mismatch",
      paymentId: input.paymentId,
      eventId: attendee.event_id,
    });
    return { ok: false, code: "identity_mismatch" };
  }

  if (payment.status !== "pending") {
    return { ok: false, code: "payment_not_pending" };
  }

  if (payment.receipt_storage_path) {
    return { ok: false, code: "receipt_already_uploaded" };
  }

  const path = buildEventPaymentReceiptPath({
    eventId: attendee.event_id,
    attendeeId: attendee.id,
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
      paymentId: input.paymentId,
      path,
    });
    return { ok: false, code: "storage_failed" };
  }

  const { error: updateError } = await admin
    .from("event_payments")
    .update({
      receipt_storage_path: path,
      receipt_uploaded_by: input.uploadedByUserId ?? null,
    })
    .eq("id", input.paymentId)
    .eq("status", "pending")
    .is("receipt_storage_path", null);

  if (updateError) {
    logSupabaseClientError("uploadEventPaymentReceiptServer:update", updateError, {
      paymentId: input.paymentId,
      path,
    });
    await admin.storage.from(EVENT_UPLOADS_BUCKET).remove([path]);
    return { ok: false, code: "update_failed" };
  }

  return { ok: true, path };
}
