import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { serializeEventFieldValuesForEnrollRpc } from "@/lib/events/serializeEventFieldValuesForEnrollRpc";
import type { EventCompanionPayload } from "@/lib/events/types";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type {
  EnrollEventAttendeeServerInput,
  EnrollEventAttendeeServerResult,
} from "@/lib/events/server/enrollEventAttendeeServer";

export function emptyEventEnrollment(resultCode: string): EnrollEventAttendeeServerResult {
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

export async function callEnrollEventAttendeeRpc(
  client: SupabaseClient,
  input: EnrollEventAttendeeServerInput,
  discountCode: string,
): Promise<EnrollEventAttendeeServerResult> {
  const flowUnitPrice = input.registrationFlow?.price;
  const { data, error } = await client.rpc(
    discountCode ? "enroll_event_attendee_with_discount" : "enroll_event_attendee",
    {
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
      ...(discountCode
        ? {
            p_discount_code: discountCode,
            p_flow_unit_price: flowUnitPrice == null ? null : flowUnitPrice,
          }
        : {}),
    },
  );

  if (error) {
    logSupabaseClientError("enrollEventAttendeeServer:rpc", error, { eventId: input.eventId });
    return emptyEventEnrollment("rpc_error");
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return emptyEventEnrollment("rpc_empty");

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
