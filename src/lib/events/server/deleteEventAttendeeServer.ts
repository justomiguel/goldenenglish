import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/server/uploadEventAttendeeFileServer";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type DeleteEventAttendeeCode = "not_found" | "not_deletable" | "delete_failed";

interface AttendeePaymentRow {
  status: string;
  gateway_provider: string | null;
  receipt_storage_path: string | null;
}

interface AttendeeDeleteRow {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  dni_or_passport: string;
  status: string;
  event_payments: AttendeePaymentRow | AttendeePaymentRow[] | null;
}

function parsePayment(raw: AttendeeDeleteRow["event_payments"]): AttendeePaymentRow | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

async function removeStoragePaths(adminClient: SupabaseClient, paths: string[], scope: string): Promise<void> {
  const safePaths = paths.filter((path) => path.trim() && !path.includes(".."));
  if (safePaths.length === 0) return;

  const { error } = await adminClient.storage.from(EVENT_UPLOADS_BUCKET).remove(safePaths);
  if (error) {
    logSupabaseClientError(`deleteEventAttendee:${scope}`, error, { pathCount: safePaths.length });
  }
}

export async function deleteEventAttendee(input: {
  adminClient: SupabaseClient;
  actorId: string;
  attendeeId: string;
  eventId?: string;
}): Promise<{ ok: boolean; code?: DeleteEventAttendeeCode }> {
  const { data, error: loadError } = await input.adminClient
    .from("event_attendees")
    .select(
      "id, event_id, first_name, last_name, email, dni_or_passport, status, event_payments(status, gateway_provider, receipt_storage_path)",
    )
    .eq("id", input.attendeeId)
    .maybeSingle();

  if (loadError) {
    logSupabaseClientError("deleteEventAttendee:load", loadError, { attendeeId: input.attendeeId });
    return { ok: false, code: "not_found" };
  }

  const row = data as AttendeeDeleteRow | null;
  if (!row) return { ok: false, code: "not_found" };
  if (input.eventId && row.event_id !== input.eventId) return { ok: false, code: "not_found" };

  const paymentRow = parsePayment(row.event_payments);
  const paymentSummary = paymentRow
    ? {
        status: String(paymentRow.status),
        amount: 0,
        currency: "CLP",
        gatewayProvider: paymentRow.gateway_provider ? String(paymentRow.gateway_provider) : null,
      }
    : null;

  if (!canDeleteEventAttendee(paymentSummary)) {
    return { ok: false, code: "not_deletable" };
  }

  const storagePaths: string[] = [];
  if (paymentRow?.receipt_storage_path?.trim()) {
    storagePaths.push(paymentRow.receipt_storage_path.trim());
  }

  const { data: fieldValues, error: fieldValuesError } = await input.adminClient
    .from("event_attendee_field_values")
    .select("file_storage_path")
    .eq("attendee_id", input.attendeeId);

  if (fieldValuesError) {
    logSupabaseClientError("deleteEventAttendee:fieldValues", fieldValuesError, {
      attendeeId: input.attendeeId,
    });
  } else {
    for (const fieldValue of fieldValues ?? []) {
      const path = fieldValue.file_storage_path;
      if (typeof path === "string" && path.trim()) storagePaths.push(path.trim());
    }
  }

  await removeStoragePaths(input.adminClient, storagePaths, "storage");

  const { error: deleteError } = await input.adminClient
    .from("event_attendees")
    .delete()
    .eq("id", input.attendeeId);

  if (deleteError) {
    logSupabaseClientError("deleteEventAttendee:delete", deleteError, { attendeeId: input.attendeeId });
    return { ok: false, code: "delete_failed" };
  }

  await recordSystemAudit({
    action: "event_attendee_delete",
    resourceType: "event_attendee",
    resourceId: input.attendeeId,
    payload: {
      event_id: row.event_id,
      attendee_status: row.status,
      email: row.email,
      dni_or_passport: row.dni_or_passport,
      payment_status: paymentRow?.status ?? null,
      actor_id: input.actorId,
    },
  });

  return { ok: true };
}
