import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEventMinorTicketCharge } from "@/lib/events/resolveEventMinorTicketCharge";
import {
  assertEventRegistrationStaging,
  eventStagingFileMeta,
} from "@/lib/events/eventRegistrationStagingPath";
import { finalizeEventTransferReceipt } from "@/lib/events/server/finalizeEventTransferReceipt";
import { storeEnrolledAttendeeCharge } from "@/lib/events/server/storeEnrolledAttendeeCharge";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { notifyAdminsEventRegistered } from "@/lib/email/notifyAdminsPurchasePayment";
import { sendEventAttendeeNotification } from "@/lib/events/server/sendEventAttendeeNotification";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import { isEventSeatMapActive, validateEventSeatSelection } from "@/lib/events/seatMapState";
import { hashSeatHoldToken } from "@/lib/events/seatHoldToken";
import { loadEventSeatLocks } from "@/lib/events/server/eventSeatLocksServer";
import {
  claimEventSeats,
  holdEventSeats,
  loadEventSeatHoldRows,
} from "@/lib/events/server/eventSeatHoldsServer";
import type {
  EventCompanionPayload,
  EventFieldPayloadEntry,
  EventTutorPayload,
} from "@/lib/events/types";
import {
  callEnrollEventAttendeeRpc,
  emptyEventEnrollment,
} from "@/lib/events/server/enrollEventAttendeeRpc";

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
  seatHoldToken?: string | null;
  maxTicketsPerRegistration?: number | null;
  minorTicketCount?: number;
  allowMinorTickets?: boolean;
  minorTicketPrice?: number | null;
  slug?: string | null;
  requireTransferReceipt?: boolean;
  receiptStagingPath?: string | null;
}

export interface EnrollEventAttendeeServerResult {
  attendeeId: string | null;
  attendeeStatus: string | null;
  paymentRequired: boolean;
  paymentId: string | null;
  resultCode: string;
  /** Seats bought. On `insufficient_seats` this is how many are left instead of seats bought. */
  seats: number;
  /** Recomputed by the database; whatever the client believed is ignored. */
  totalAmount: number | null;
  takenSeatKeys?: string[];
}

const ENROLL_MAIL_CODES = new Set(["confirmed", "payment_pending", "waitlist"]);

export async function enrollEventAttendeeServer(
  input: EnrollEventAttendeeServerInput,
): Promise<EnrollEventAttendeeServerResult> {
  const admin = await createAdminClient();
  const discountCode = input.discountCode?.trim() ?? "";
  if (discountCode && input.familyDiscountClaimed === true) {
    return emptyEventEnrollment("discount_conflict");
  }
  const fileGate = assertEventRegistrationStaging({
    eventId: input.eventId,
    slug: input.slug ?? "",
    email: input.email,
    dniOrPassport: input.dniOrPassport,
    requireReceipt: Boolean(input.requireTransferReceipt),
    receiptPath: input.receiptStagingPath ?? "",
    filePaths: input.fieldValues.flatMap((entry) =>
      entry.fileStoragePath ? [{ fieldId: entry.fieldId, path: entry.fileStoragePath }] : [],
    ),
  });
  if (!fileGate.ok) {
    await logServerWarn("events.enroll.staging", { reason: fileGate.code, eventId: input.eventId });
    return emptyEventEnrollment(fileGate.code);
  }

  const minorPreview = resolveEventMinorTicketCharge({
    seats: 1 + (input.companions?.length ?? 0),
    minorTickets: input.minorTicketCount ?? 0,
    adultUnitPrice: 0,
    minorUnitPrice: input.minorTicketPrice ?? null,
    allowMinorTickets: Boolean(input.allowMinorTickets),
  });
  if (!minorPreview.ok) return emptyEventEnrollment(minorPreview.reason);

  let assignedSeats: Array<{ seatKey: string; seatLabel: string }> = [];
  let seatTokenHash: string | null = null;
  if (isEventSeatMapActive(input.seatMapConfig)) {
    seatTokenHash = hashSeatHoldToken(input.seatHoldToken);
    if (!seatTokenHash) return emptyEventEnrollment("seat_hold_required");
    const holds = await loadEventSeatHoldRows(admin, input.eventId, seatTokenHash);
    const locks = await loadEventSeatLocks(admin, input.eventId);
    const requiredSeatCount = 1 + (input.companions?.length ?? 0);
    const seatCheck = validateEventSeatSelection({
      config: input.seatMapConfig,
      locks,
      heldByOthers: holds.heldByOthers,
      selectedSeatKeys: input.seatKeys ?? [],
      requiredSeatCount,
    });
    if (!seatCheck.ok) {
      if (seatCheck.code !== "seat_already_taken") return emptyEventEnrollment(seatCheck.code);
      const taken = (input.seatKeys ?? []).filter((key) =>
        holds.heldByOthers.includes(key) || locks.some((lock) => lock.seatKey === key),
      );
      return { ...emptyEventEnrollment(seatCheck.code), takenSeatKeys: taken };
    }
    const held = await holdEventSeats(admin, {
      eventId: input.eventId,
      tokenHash: seatTokenHash,
      seatKeys: seatCheck.assignedSeats.map((seat) => seat.seatKey),
      maxSeats: input.maxTicketsPerRegistration ?? requiredSeatCount,
    });
    if (!held.ok) return emptyEventEnrollment(held.code);
    if (held.taken.length > 0) {
      return { ...emptyEventEnrollment("seat_already_taken"), takenSeatKeys: held.taken };
    }
    assignedSeats = seatCheck.assignedSeats;
  }

  const result = await callEnrollEventAttendeeRpc(admin, input, discountCode);
  if (!result.attendeeId || !ENROLL_MAIL_CODES.has(result.resultCode)) return result;

  if (assignedSeats.length > 0 && seatTokenHash) {
    const claimed = await claimEventSeats(admin, {
      eventId: input.eventId,
      attendeeId: result.attendeeId,
      tokenHash: seatTokenHash,
      seats: assignedSeats,
    });
    if (!claimed.ok) {
      const { error: rollbackError } = await admin
        .from("event_attendees")
        .delete()
        .eq("id", result.attendeeId);
      if (rollbackError) {
        await logServerWarn("events.seats.claim.rollback", { attendeeId: result.attendeeId });
      }
      return { ...emptyEventEnrollment(claimed.code), takenSeatKeys: claimed.taken };
    }
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
  if (!stored.ok) return emptyEventEnrollment(stored.reason);

  if (stored.paymentRequired && input.requireTransferReceipt) {
    const file = eventStagingFileMeta(input.receiptStagingPath ?? "");
    const attached = await finalizeEventTransferReceipt(admin, {
      eventId: input.eventId,
      attendeeId: result.attendeeId,
      amount: stored.totalAmount ?? 0,
      currency: input.currency?.trim() || "CLP",
      stagingPath: input.receiptStagingPath ?? "",
      fileName: file.fileName,
      mime: file.mime,
      uploadedByUserId: input.userId ?? null,
    });
    if (!attached.ok) return emptyEventEnrollment("receipt_attach_failed");
  }

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
