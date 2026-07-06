import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { serializeEventFieldValuesForEnrollRpc } from "@/lib/events/serializeEventFieldValuesForEnrollRpc";
import type { EventFieldPayloadEntry, EventTutorPayload } from "@/lib/events/types";

export interface EnrollEventAttendeeServerInput {
  eventId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  dniOrPassport: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  source: "public" | "logged_in" | "admin_manual";
  isLocalResident?: boolean;
  tutor?: EventTutorPayload;
  fieldValues: EventFieldPayloadEntry[];
}

export interface EnrollEventAttendeeServerResult {
  attendeeId: string | null;
  attendeeStatus: string | null;
  paymentRequired: boolean;
  paymentId: string | null;
  resultCode: string;
}

async function callEnrollRpc(
  client: SupabaseClient,
  input: EnrollEventAttendeeServerInput,
): Promise<EnrollEventAttendeeServerResult> {
  const { data, error } = await client.rpc("enroll_event_attendee", {
    p_event_id: input.eventId,
    p_user_id: input.userId ?? null,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_dni_or_passport: input.dniOrPassport,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_birth_date: input.birthDate ?? null,
    p_tutor_id: input.tutor?.tutorId ?? null,
    p_tutor_first_name: input.tutor?.tutorFirstName ?? null,
    p_tutor_last_name: input.tutor?.tutorLastName ?? null,
    p_tutor_dni_or_passport: input.tutor?.tutorDniOrPassport ?? null,
    p_tutor_email: input.tutor?.tutorEmail ?? null,
    p_tutor_phone: input.tutor?.tutorPhone ?? null,
    p_tutor_relationship: input.tutor?.tutorRelationship ?? null,
    p_source: input.source,
    p_is_local_resident: input.isLocalResident ?? true,
    p_field_values: serializeEventFieldValuesForEnrollRpc(input.fieldValues),
  });

  if (error) {
    logSupabaseClientError("enrollEventAttendeeServer:rpc", error, { eventId: input.eventId });
    return {
      attendeeId: null,
      attendeeStatus: null,
      paymentRequired: false,
      paymentId: null,
      resultCode: "rpc_error",
    };
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    return {
      attendeeId: null,
      attendeeStatus: null,
      paymentRequired: false,
      paymentId: null,
      resultCode: "rpc_empty",
    };
  }

  return {
    attendeeId: row.attendee_id ? String(row.attendee_id) : null,
    attendeeStatus: row.attendee_status ? String(row.attendee_status) : null,
    paymentRequired: Boolean(row.payment_required),
    paymentId: row.payment_id ? String(row.payment_id) : null,
    resultCode: String(row.result_code ?? "unknown"),
  };
}

export async function enrollEventAttendeeServer(
  input: EnrollEventAttendeeServerInput,
): Promise<EnrollEventAttendeeServerResult> {
  const admin = createAdminClient();
  return callEnrollRpc(admin, input);
}
