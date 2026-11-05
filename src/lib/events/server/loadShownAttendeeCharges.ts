import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";
import { shownEventChargeAmount } from "@/lib/events/shownEventChargeAmount";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface AttendeeChargeRow {
  id: string;
  is_local_resident: boolean | null;
  family_discount_claimed: boolean | null;
  minor_ticket_count: number | null;
  ticket_package_id: string | null;
  registration_flow_id: string | null;
}

interface EventChargeRow {
  currency: string | null;
  price: number | null;
  price_local: number | null;
  price_non_local: number | null;
  price_by_flow: boolean | null;
  minor_ticket_price: number | null;
}

interface RedemptionRow {
  attendee_id: string;
  discount_percent: number | null;
  discount_amount: number | null;
  ticket_count: number | null;
  event_discount_codes: { code: string | null } | { code: string | null }[] | null;
}

function one<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function appliedCode(row: RedemptionRow): EventDiscountApplied | null {
  const code = one(row.event_discount_codes)?.code?.trim() || "code";
  const percent = row.discount_percent == null ? null : Number(row.discount_percent);
  if (percent != null && percent > 0) return { code, kind: "percent", percent };
  const discountAmount = row.discount_amount == null ? null : Number(row.discount_amount);
  const ticketCount = row.ticket_count == null ? null : Number(row.ticket_count);
  if (discountAmount != null && ticketCount != null && discountAmount > 0 && ticketCount > 0) {
    return { code, kind: "amount", discountAmount, ticketCount };
  }
  return null;
}

/** Shown registration total for each titular. Missing price keeps the caller on the stored amount. */
export async function loadShownAttendeeCharges(
  admin: SupabaseClient,
  eventId: string,
  attendeeIds: string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(attendeeIds.filter(Boolean))];
  const shown = new Map<string, number>();
  if (ids.length === 0) return shown;

  try {
  const [eventResult, attendeeResult, redemptionResult, companionResult] = await Promise.all([
    admin
      .from("events")
      .select("currency, price, price_local, price_non_local, price_by_flow, minor_ticket_price")
      .eq("id", eventId)
      .maybeSingle(),
    admin
      .from("event_attendees")
      .select(
        "id, is_local_resident, family_discount_claimed, minor_ticket_count, ticket_package_id, registration_flow_id",
      )
      .in("id", ids),
    admin
      .from("event_discount_code_redemptions")
      .select(
        "attendee_id, discount_percent, discount_amount, ticket_count, event_discount_codes(code)",
      )
      .in("attendee_id", ids)
      .in("status", ["reserved", "consumed"]),
    admin
      .from("event_attendees")
      .select("primary_attendee_id, status")
      .in("primary_attendee_id", ids),
  ]);

  if (eventResult.error) {
    logSupabaseClientError("loadShownAttendeeCharges:event", eventResult.error, { eventId });
    return shown;
  }
  const event = eventResult.data as EventChargeRow | null;
  if (!event) return shown;
  if (attendeeResult.error || redemptionResult.error || companionResult.error) {
    logSupabaseClientError(
      "loadShownAttendeeCharges:rows",
      attendeeResult.error ?? redemptionResult.error ?? companionResult.error,
      { eventId },
    );
    return shown;
  }

  const attendees = (attendeeResult.data ?? []) as AttendeeChargeRow[];
  const flowIds = [...new Set(attendees.flatMap((row) => (row.registration_flow_id ? [row.registration_flow_id] : [])))];
  const packageIds = [...new Set(attendees.flatMap((row) => (row.ticket_package_id ? [row.ticket_package_id] : [])))];
  const [flows, packages] = await Promise.all([
    flowIds.length === 0
      ? Promise.resolve(new Map<string, number | null>())
      : admin
          .from("event_registration_flows")
          .select("id, price")
          .in("id", flowIds)
          .then((result) => {
            if (result.error) {
              logSupabaseClientError("loadShownAttendeeCharges:flows", result.error, { eventId });
            }
            const map = new Map<string, number | null>();
            for (const row of (result.data ?? []) as { id: string; price: number | null }[]) {
              map.set(String(row.id), row.price == null ? null : Number(row.price));
            }
            return map;
          }),
    packageIds.length === 0
      ? Promise.resolve(new Map<string, number>())
      : admin
          .from("event_ticket_packages")
          .select("id, price")
          .in("id", packageIds)
          .then((result) => {
            if (result.error) {
              logSupabaseClientError("loadShownAttendeeCharges:packages", result.error, { eventId });
            }
            const map = new Map<string, number>();
            for (const row of (result.data ?? []) as { id: string; price: number | null }[]) {
              if (row.price != null) map.set(String(row.id), Number(row.price));
            }
            return map;
          }),
  ]);

  const companions = new Map<string, number>();
  for (const row of (companionResult.data ?? []) as { primary_attendee_id: string; status: string }[]) {
    if (row.status === "cancelled") continue;
    const id = String(row.primary_attendee_id);
    companions.set(id, (companions.get(id) ?? 0) + 1);
  }
  const codes = new Map<string, EventDiscountApplied | null>();
  for (const row of (redemptionResult.data ?? []) as RedemptionRow[]) {
    codes.set(String(row.attendee_id), appliedCode(row));
  }

  for (const attendee of attendees) {
    const id = String(attendee.id);
    const amount = shownEventChargeAmount({
      currency: event.currency?.trim() || "CLP",
      isLocalResident: attendee.is_local_resident !== false,
      price: event.price == null ? null : Number(event.price),
      priceLocal: event.price_local == null ? null : Number(event.price_local),
      priceNonLocal: event.price_non_local == null ? null : Number(event.price_non_local),
      priceByFlow: event.price_by_flow === true,
      flowPrice: attendee.registration_flow_id ? (flows.get(attendee.registration_flow_id) ?? null) : null,
      packagePrice: attendee.ticket_package_id ? (packages.get(attendee.ticket_package_id) ?? null) : null,
      seats: 1 + (companions.get(id) ?? 0),
      minorTickets: Number(attendee.minor_ticket_count ?? 0),
      minorUnitPrice: event.minor_ticket_price == null ? null : Number(event.minor_ticket_price),
      familyDiscountClaimed: attendee.family_discount_claimed === true,
      appliedCode: codes.get(id) ?? null,
    });
    if (amount != null) shown.set(id, amount);
  }
  return shown;
  } catch (error) {
    await logServerActionException("loadShownAttendeeCharges", error, { eventId });
    return new Map();
  }
}
