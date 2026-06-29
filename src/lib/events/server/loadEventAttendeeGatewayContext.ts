import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveEventPriceForResidency } from "@/lib/events/resolveEventPriceTier";

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
  amount: number;
}

interface AttendeeRow {
  id: string;
  status: string;
  is_local_resident: boolean | null;
  email: string;
  dni_or_passport: string;
  event_id: string;
  events: {
    slug: string;
    title: string;
    currency: string;
    price: number | null;
    price_local: number | null;
    price_non_local: number | null;
  };
}

function pickEvent(raw: AttendeeRow["events"] | AttendeeRow["events"][]): AttendeeRow["events"] {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Loads the canonical payment amount/currency and identity context for an attendee.
 *
 * The amount is derived from the event's tiered pricing and the attendee's residency,
 * never trusting client- or gateway-reported amounts. Used by the deferred payment
 * lifecycle (gateway checkout start, gateway finalization, transfer receipt upload).
 */
export async function loadEventAttendeeGatewayContext(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<EventAttendeeGatewayContext | null> {
  const { data, error } = await admin
    .from("event_attendees")
    .select(
      "id, status, is_local_resident, email, dni_or_passport, event_id, events!inner(slug, title, currency, price, price_local, price_non_local)",
    )
    .eq("id", attendeeId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("loadEventAttendeeGatewayContext:select", error, { attendeeId });
    return null;
  }

  const row = data as AttendeeRow | null;
  if (!row?.id) return null;

  const event = pickEvent(row.events);
  if (!event) return null;

  const isLocalResident = row.is_local_resident ?? true;
  const amount =
    resolveEventPriceForResidency(
      {
        price: event.price,
        priceLocal: event.price_local,
        priceNonLocal: event.price_non_local,
      },
      isLocalResident,
    ) ?? 0;

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
    amount: Number(amount),
  };
}
