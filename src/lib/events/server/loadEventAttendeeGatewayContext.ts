import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
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
  event_ticket_packages: { price: number } | { price: number }[] | null;
  events: {
    slug: string;
    title: string;
    currency: string;
    price: number | null;
    price_local: number | null;
    price_non_local: number | null;
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
      "id, status, is_local_resident, email, dni_or_passport, event_id, primary_attendee_id, ticket_package_id, event_ticket_packages(price), events!inner(slug, title, currency, price, price_local, price_non_local)",
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
  const unitPrice =
    resolveEventSeatPrice(
      {
        price: event.price,
        priceLocal: event.price_local,
        priceNonLocal: event.price_non_local,
      },
      ticketPackage,
      isLocalResident,
    ) ?? 0;

  const seats = 1 + (await countCompanionSeats(admin, attendeeId));

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
    amount: Number(unitPrice) * seats,
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
