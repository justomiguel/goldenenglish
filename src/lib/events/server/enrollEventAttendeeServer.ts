import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { serializeEventFieldValuesForEnrollRpc } from "@/lib/events/serializeEventFieldValuesForEnrollRpc";
import type {
  EventCompanionPayload,
  EventFieldPayloadEntry,
  EventTutorPayload,
} from "@/lib/events/types";

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
  ticketPackageId?: string | null;
  companions?: EventCompanionPayload[];
}

export interface EnrollEventAttendeeServerResult {
  attendeeId: string | null;
  attendeeStatus: string | null;
  paymentRequired: boolean;
  paymentId: string | null;
  resultCode: string;
  /** Seats bought. On `insufficient_seats` this is how many are left instead. */
  seats: number;
  /** Recomputed by the database; whatever the client believed is ignored. */
  totalAmount: number | null;
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
    p_ticket_package_id: input.ticketPackageId ?? null,
    p_companions: serializeCompanionsForEnrollRpc(input.companions ?? []),
  });

  if (error) {
    logSupabaseClientError("enrollEventAttendeeServer:rpc", error, { eventId: input.eventId });
    return failure("rpc_error");
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return failure("rpc_empty");

  return {
    attendeeId: row.attendee_id ? String(row.attendee_id) : null,
    attendeeStatus: row.attendee_status ? String(row.attendee_status) : null,
    paymentRequired: Boolean(row.payment_required),
    paymentId: row.payment_id ? String(row.payment_id) : null,
    resultCode: String(row.result_code ?? "unknown"),
    seats: Number(row.seats ?? 0),
    totalAmount: row.total_amount == null ? null : Number(row.total_amount),
  };
}

function failure(resultCode: string): EnrollEventAttendeeServerResult {
  return {
    attendeeId: null,
    attendeeStatus: null,
    paymentRequired: false,
    paymentId: null,
    resultCode,
    seats: 0,
    totalAmount: null,
  };
}

function serializeCompanionsForEnrollRpc(companions: EventCompanionPayload[]) {
  return companions.map((companion) => ({
    first_name: companion.firstName,
    last_name: companion.lastName,
    dni_or_passport: companion.dniOrPassport ?? null,
    email: companion.email ?? null,
    birth_date: companion.birthDate ?? null,
    field_values: serializeEventFieldValuesForEnrollRpc(companion.fieldValues ?? []),
  }));
}

export async function enrollEventAttendeeServer(
  input: EnrollEventAttendeeServerInput,
): Promise<EnrollEventAttendeeServerResult> {
  const admin = createAdminClient();
  return callEnrollRpc(admin, input);
}
