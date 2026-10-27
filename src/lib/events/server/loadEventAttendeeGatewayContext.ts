import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { applyEventCodeDiscount } from "@/lib/events/applyEventCodeDiscount";
import { applyEventFamilyDiscount } from "@/lib/events/applyEventFamilyDiscount";
import { applyEventFixedAmountDiscount, roundEventMoney } from "@/lib/events/applyEventFixedAmountDiscount";
import { resolveEventMinorTicketCharge } from "@/lib/events/resolveEventMinorTicketCharge";
import { resolveEventSeatPrice } from "@/lib/events/resolveEventRegistrationTotal";

export interface EventAttendeeGatewayContext {
  attendeeId: string;
  eventId: string;
  attendeeStatus: string;
  isLocalResident: boolean;
  email: string;
  dniOrPassport: string;
  slug: string;
  title: string;
  currency: string;
  /** Titular plus every companion still occupying a seat. */
  seats: number;
  /** Unit price × seats. The whole purchase is charged once, to the titular. */
  amount: number;
}

interface AttendeeRow {
  id: string;
  status: string;
  is_local_resident: boolean | null;
  email: string;
  dni_or_passport: string;
  event_id: string;
  primary_attendee_id: string | null;
  ticket_package_id: string | null;
  family_discount_claimed: boolean | null;
  minor_ticket_count: number | null;
  event_ticket_packages: { price: number } | { price: number }[] | null;
  event_registration_flows: { price: number | null } | { price: number | null }[] | null;
  events: {
    slug: string;
    title: string;
    currency: string;
    price: number | null;
    price_local: number | null;
    price_non_local: number | null;
    price_by_flow: boolean | null;
    allow_minor_tickets: boolean | null;
    minor_ticket_price: number | null;
  };
}

/** Seats that count against capacity — the same rule the enroll RPC applies. */
const OCCUPYING_STATUSES = ["confirmed", "pending_payment"];

function pickOne<T>(raw: T | T[] | null): T | null {
  if (raw == null) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

/**
 * Loads the canonical payment amount/currency and identity context for an attendee.
 *
 * The amount is derived from the package price or the event's tiered pricing and
 * the attendee's residency, multiplied by the seats in the purchase — never
 * trusting client- or gateway-reported amounts. Used by the deferred payment
 * lifecycle (gateway checkout start, gateway finalization, transfer receipt upload).
 *
 * Returns null for a companion seat: the payment belongs to the titular and
 * `event_payments.event_attendee_id` is unique, so letting a companion through
 * here would let one purchase open two checkouts.
 */
export async function loadEventAttendeeGatewayContext(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<EventAttendeeGatewayContext | null> {
  const { data, error } = await admin
    .from("event_attendees")
    .select(
      "id, status, is_local_resident, email, dni_or_passport, event_id, primary_attendee_id, ticket_package_id, family_discount_claimed, minor_ticket_count, event_ticket_packages(price), event_registration_flows(price), events!inner(slug, title, currency, price, price_local, price_non_local, price_by_flow, allow_minor_tickets, minor_ticket_price)",
    )
    .eq("id", attendeeId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("loadEventAttendeeGatewayContext:select", error, { attendeeId });
    return null;
  }

  const row = data as AttendeeRow | null;
  if (!row?.id) return null;
  if (row.primary_attendee_id) return null;

  const event = pickOne(row.events);
  if (!event) return null;

  const isLocalResident = row.is_local_resident ?? true;
  const ticketPackage = pickOne(row.event_ticket_packages);
  const flow = pickOne(row.event_registration_flows);
  const flowPrice = event.price_by_flow
    ? { price: flow?.price == null ? 0 : Number(flow.price) }
    : null;
  const unitPrice =
    resolveEventSeatPrice(
      {
        price: event.price,
        priceLocal: event.price_local,
        priceNonLocal: event.price_non_local,
      },
      flowPrice ? null : ticketPackage,
      isLocalResident,
      flowPrice,
    ) ?? 0;

  const seats = 1 + (await countCompanionSeats(admin, attendeeId));
  const minorTickets = Math.max(0, Math.floor(Number(row.minor_ticket_count ?? 0)));
  const minorUnitPrice = event.minor_ticket_price == null ? null : Number(event.minor_ticket_price);
  const minorCharge = resolveEventMinorTicketCharge({
    seats,
    minorTickets,
    adultUnitPrice: Number(unitPrice),
    minorUnitPrice,
    allowMinorTickets: Boolean(event.allow_minor_tickets) || minorTickets > 0,
  });
  const baseAmount = minorCharge.ok ? minorCharge.subtotal : Number(unitPrice) * seats;
  const redemption = await loadDiscountSnapshot(admin, attendeeId);
  const amount = chargeAmount({
    baseAmount,
    unitPrice: Number(unitPrice),
    seats,
    currency: event.currency,
    familyClaimed: row.family_discount_claimed === true,
    redemption,
    mixedPrices: minorCharge.ok && minorCharge.minorTickets > 0,
  });

  return {
    attendeeId: String(row.id),
    eventId: String(row.event_id),
    attendeeStatus: String(row.status),
    isLocalResident,
    email: row.email,
    dniOrPassport: row.dni_or_passport,
    slug: event.slug,
    title: event.title,
    currency: event.currency,
    seats,
    amount,
  };
}

interface DiscountSnapshot {
  percent: number | null;
  discountAmount: number | null;
  ticketCount: number | null;
}

function chargeAmount(input: {
  baseAmount: number;
  unitPrice: number;
  seats: number;
  currency: string;
  familyClaimed: boolean;
  redemption: DiscountSnapshot | null;
  mixedPrices?: boolean;
}): number {
  const redemption = input.redemption;
  if (redemption?.discountAmount != null && redemption.ticketCount != null && input.mixedPrices) {
    const covered = Math.min(input.seats, Math.max(0, Math.floor(redemption.ticketCount)));
    return roundEventMoney(Math.max(0, input.baseAmount - covered * redemption.discountAmount), input.currency);
  }
  if (redemption?.discountAmount != null && redemption.ticketCount != null) {
    return applyEventFixedAmountDiscount({
      unitPrice: input.unitPrice,
      seats: input.seats,
      discountAmount: redemption.discountAmount,
      ticketCount: redemption.ticketCount,
      currency: input.currency,
    }).total;
  }
  if (redemption?.percent != null) {
    return applyEventCodeDiscount({
      amount: input.baseAmount,
      percent: redemption.percent,
      currency: input.currency,
    });
  }
  return applyEventFamilyDiscount({
    amount: input.baseAmount,
    claimed: input.familyClaimed,
    currency: input.currency,
  });
}

async function loadDiscountSnapshot(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<DiscountSnapshot | null> {
  const { data, error } = await admin
    .from("event_discount_code_redemptions")
    .select("discount_percent, discount_amount, ticket_count")
    .eq("attendee_id", attendeeId)
    .in("status", ["reserved", "consumed"])
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadEventAttendeeGatewayContext:discount", error, { attendeeId });
    return null;
  }
  if (!data) return null;
  return {
    percent: data.discount_percent == null ? null : Number(data.discount_percent),
    discountAmount: data.discount_amount == null ? null : Number(data.discount_amount),
    ticketCount: data.ticket_count == null ? null : Number(data.ticket_count),
  };
}

async function countCompanionSeats(admin: SupabaseClient, titularId: string): Promise<number> {
  const { data, error } = await admin
    .from("event_attendees")
    .select("id")
    .eq("primary_attendee_id", titularId)
    .in("status", OCCUPYING_STATUSES);

  if (error) {
    // Undercharging is the safer failure here than guessing: the titular's own
    // seat is still charged, and the discrepancy surfaces in the admin panel.
    logSupabaseClientError("loadEventAttendeeGatewayContext:companions", error, { titularId });
    return 0;
  }

  return (data ?? []).length;
}
