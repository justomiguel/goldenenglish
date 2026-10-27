import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { serializeEventFieldValuesForEnrollRpc } from "@/lib/events/serializeEventFieldValuesForEnrollRpc";
import { resolveEventMinorTicketCharge } from "@/lib/events/resolveEventMinorTicketCharge";
import { storeEnrolledAttendeeCharge } from "@/lib/events/server/storeEnrolledAttendeeCharge";
import { notifyAdminsEventRegistered } from "@/lib/email/notifyAdminsPurchasePayment";
import { sendEventAttendeeNotification } from "@/lib/events/server/sendEventAttendeeNotification";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import { isEventSeatMapActive, validateEventSeatSelection } from "@/lib/events/seatMapState";
import {
  loadEventSeatLocks,
  lockSeatsForAttendee,
} from "@/lib/events/server/eventSeatLocksServer";
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
  /** When set, the seat price is this flow's amount and residency is not charged. */
  registrationFlow?: { id: string; price: number | null } | null;
  /** Language of the registration page. Stored on the attendee for later mails. */
  locale?: string | null;
  /** Claim only. The charged amount is recomputed on the server. */
  familyDiscountClaimed?: boolean;
  currency?: string | null;
  /** Code text. The server computes the amount. Empty means no code. */
  discountCode?: string | null;
  /** Selected bank transfer destination when dual transfer mode is active. */
  transferSelection?: {
    sourceKey: "source_1" | "source_2" | "global";
    sourceLabel: string;
    questionAnswer: string | null;
  } | null;
  seatMapConfig?: EventSeatMapConfig | null;
  seatKeys?: string[];
  minorTicketCount?: number;
  allowMinorTickets?: boolean;
  minorTicketPrice?: number | null;
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

const ENROLL_MAIL_CODES = new Set(["confirmed", "payment_pending", "waitlist"]);

export async function enrollEventAttendeeServer(
  input: EnrollEventAttendeeServerInput,
): Promise<EnrollEventAttendeeServerResult> {
  const admin = await createAdminClient();
  const discountCode = input.discountCode?.trim() ?? "";
  if (discountCode && input.familyDiscountClaimed === true) return failure("discount_conflict");
  const minorPreview = resolveEventMinorTicketCharge({
    seats: 1 + (input.companions?.length ?? 0),
    minorTickets: input.minorTicketCount ?? 0,
    adultUnitPrice: 0,
    minorUnitPrice: input.minorTicketPrice ?? null,
    allowMinorTickets: Boolean(input.allowMinorTickets),
  });
  if (!minorPreview.ok) return failure(minorPreview.reason);

  let assignedSeats: Array<{ seatKey: string; seatLabel: string }> = [];
  if (isEventSeatMapActive(input.seatMapConfig)) {
    const locks = await loadEventSeatLocks(admin, input.eventId);
    const seatCheck = validateEventSeatSelection({
      config: input.seatMapConfig,
      locks,
      selectedSeatKeys: input.seatKeys ?? [],
      requiredSeatCount: 1 + (input.companions?.length ?? 0),
    });
    if (!seatCheck.ok) return failure(seatCheck.code);
    assignedSeats = seatCheck.assignedSeats;
  }

  const result = await callEnrollRpc(admin, input, discountCode);
  if (!result.attendeeId || !ENROLL_MAIL_CODES.has(result.resultCode)) return result;

  if (assignedSeats.length > 0) {
    const lockRes = await lockSeatsForAttendee(admin, {
      eventId: input.eventId,
      attendeeId: result.attendeeId,
      seats: assignedSeats,
    });
    if (!lockRes.ok) return failure(lockRes.code);
  }

  const stored = await storeEnrolledAttendeeCharge(admin, {
    eventId: input.eventId,
    attendeeId: result.attendeeId,
    locale: input.locale,
    discountCode,
    familyDiscountClaimed: input.familyDiscountClaimed,
    currency: input.currency,
    registrationFlow: input.registrationFlow,
    minorTicketCount: input.minorTicketCount,
    allowMinorTickets: input.allowMinorTickets,
    minorTicketPrice: input.minorTicketPrice,
    transferSelection: input.transferSelection,
    rpcTotal: result.totalAmount,
    rpcStatus: result.attendeeStatus,
    rpcPaymentRequired: result.paymentRequired,
    seats: result.seats,
  });
  if (!stored.ok) return failure(stored.reason);

  await sendEventAttendeeNotification({
    attendeeId: result.attendeeId,
    templateKey: "events.registered",
  });

  if (result.resultCode !== "waitlist") {
    await notifyAdminsEventRegistered({
      eventId: input.eventId,
      firstName: input.firstName,
      lastName: input.lastName,
      seatCount: result.seats,
      amount: stored.totalAmount,
      currency: input.currency ?? null,
      paymentPending: stored.paymentRequired,
      locale: input.locale ?? null,
    });
  }

  return {
    ...result,
    attendeeStatus: stored.attendeeStatus,
    paymentRequired: stored.paymentRequired,
    totalAmount: stored.totalAmount,
  };
}
