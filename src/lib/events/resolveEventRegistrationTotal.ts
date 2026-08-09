import {
  resolveEventPriceForResidency,
  type EventPriceSource,
} from "@/lib/events/resolveEventPriceTier";

/**
 * An event is "in package mode" when it has at least one active package. There
 * is no pricing_mode column to keep in sync: the packages themselves are the
 * switch (D2).
 */
export function eventUsesPackages(activePackages: { id: string }[]): boolean {
  return activePackages.length > 0;
}

/**
 * Price of one seat. In package mode the package decides, and residency stops
 * affecting the amount (D1) — note the explicit null check, since a package that
 * is free must stay free rather than falling through to a residency tier.
 */
export function resolveEventSeatPrice(
  source: EventPriceSource,
  ticketPackage: { price: number } | null,
  isLocalResident: boolean,
): number | null {
  if (ticketPackage) return Number(ticketPackage.price);
  return resolveEventPriceForResidency(source, isLocalResident);
}

export type EventRegistrationTotal =
  | { ok: true; seats: number; total: number }
  | { ok: false; reason: "seats_below_one" | "multiple_not_allowed" | "over_max" };

export function resolveEventRegistrationTotal(input: {
  unitPrice: number | null;
  seats: number;
  allowMultipleTickets: boolean;
  maxTicketsPerRegistration: number | null;
}): EventRegistrationTotal {
  const { unitPrice, seats, allowMultipleTickets, maxTicketsPerRegistration } = input;

  if (!Number.isFinite(seats) || seats < 1) return { ok: false, reason: "seats_below_one" };
  if (seats > 1 && !allowMultipleTickets) return { ok: false, reason: "multiple_not_allowed" };

  // "Unlimited" is never implicit: without a maximum an event sells one seat.
  const max = allowMultipleTickets ? (maxTicketsPerRegistration ?? 1) : 1;
  if (seats > max) return { ok: false, reason: "over_max" };

  return { ok: true, seats, total: (unitPrice ?? 0) * seats };
}
