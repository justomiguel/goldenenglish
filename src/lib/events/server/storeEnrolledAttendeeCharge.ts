import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseEventEmailLocale } from "@/lib/events/eventEmailCopy";
import { registrationFlowCharge } from "@/lib/events/registrationFlows";
import { finalizeEnrollCharge } from "@/lib/events/resolveEventMinorTicketCharge";

export async function storeEnrolledAttendeeCharge(
  admin: SupabaseClient,
  input: {
    eventId: string;
    attendeeId: string;
    locale?: string | null;
    discountCode: string;
    familyDiscountClaimed?: boolean;
    currency?: string | null;
    registrationFlow?: { id: string; price: number | null } | null;
    minorTicketCount?: number;
    allowMinorTickets?: boolean;
    minorTicketPrice?: number | null;
    transferSelection?: {
      sourceKey: "source_1" | "source_2" | "global";
      sourceLabel: string;
      questionAnswer: string | null;
    } | null;
    rpcTotal: number | null;
    rpcStatus: string | null;
    rpcPaymentRequired: boolean;
    seats: number;
  },
): Promise<
  | { ok: true; attendeeStatus: string | null; paymentRequired: boolean; totalAmount: number | null }
  | { ok: false; reason: string }
> {
  const flow = input.registrationFlow;
  const claimed = !input.discountCode && input.familyDiscountClaimed === true;
  const currency = input.currency?.trim() || "CLP";
  const charge =
    flow?.price == null
      ? null
      : registrationFlowCharge({ price: flow.price, seats: input.seats, status: input.rpcStatus });
  const payable = finalizeEnrollCharge({
    rpcTotal: input.rpcTotal,
    rpcStatus: input.rpcStatus,
    rpcPaymentRequired: input.rpcPaymentRequired,
    seats: Math.max(1, input.seats),
    flowUnitPrice: flow?.price ?? null,
    flowStatus: charge?.status ?? null,
    flowPaymentRequired: charge?.paymentRequired ?? null,
    minorTickets: input.minorTicketCount ?? 0,
    minorUnitPrice: input.minorTicketPrice ?? null,
    allowMinorTickets: Boolean(input.allowMinorTickets),
    discountCode: Boolean(input.discountCode),
    familyClaimed: claimed,
    currency,
  });
  if (!payable.ok) return payable;

  const { error } = await admin
    .from("event_attendees")
    .update({
      registration_locale: parseEventEmailLocale(input.locale),
      family_discount_claimed: claimed,
      minor_ticket_count: payable.minorTickets,
      ...(flow ? { registration_flow_id: flow.id } : {}),
      ...(payable.statusPatch ? { status: payable.statusPatch } : {}),
      ...(input.transferSelection
        ? {
            transfer_source_key: input.transferSelection.sourceKey,
            transfer_source_label: input.transferSelection.sourceLabel,
            transfer_question_answer: input.transferSelection.questionAnswer,
          }
        : {}),
    })
    .eq("id", input.attendeeId);
  if (error) {
    logSupabaseClientError("enrollEventAttendeeServer:flow", error, {
      eventId: input.eventId,
      attendeeId: input.attendeeId,
    });
  }

  return {
    ok: true,
    attendeeStatus: payable.attendeeStatus,
    paymentRequired: payable.paymentRequired,
    totalAmount: payable.totalAmount,
  };
}
