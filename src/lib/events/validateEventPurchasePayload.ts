import type { EventCompanionPayload } from "@/lib/events/types";

export interface EventPurchaseSettings {
  /** Ids of the event's non-archived packages. Empty means residency pricing. */
  activePackageIds: string[];
  allowMultipleTickets: boolean;
  maxTicketsPerRegistration: number | null;
  companionCollectDni: boolean;
  companionCollectBirthDate: boolean;
  companionCollectEmail: boolean;
}

export type EventPurchaseRejection =
  | "package_not_allowed"
  | "package_required"
  | "package_not_found"
  | "multiple_tickets_not_allowed"
  | "too_many_tickets"
  | "companion_name_required"
  | "invalid_companions";

export type EventPurchaseValidation =
  | { ok: true; ticketPackageId: string | null; companions: EventCompanionPayload[] }
  | { ok: false; code: EventPurchaseRejection };

interface RawPurchaseInput {
  ticketPackageId?: string | null;
  companions?: unknown;
}

/**
 * Validates the package and companion half of a registration before it reaches
 * the RPC. The RPC rejects the same cases, but a reader-friendly code beats a
 * database result_code — and rejecting here saves a round trip.
 *
 * Nothing about money is accepted or returned: the amount is the RPC's business.
 */
export function validateEventPurchasePayload(
  settings: EventPurchaseSettings,
  raw: RawPurchaseInput,
): EventPurchaseValidation {
  const requested = raw.ticketPackageId?.trim() || null;
  const hasPackages = settings.activePackageIds.length > 0;

  if (requested && !hasPackages) return { ok: false, code: "package_not_allowed" };
  if (hasPackages && !requested) return { ok: false, code: "package_required" };
  if (requested && !settings.activePackageIds.includes(requested)) {
    return { ok: false, code: "package_not_found" };
  }

  const rawCompanions = raw.companions ?? [];
  if (!Array.isArray(rawCompanions)) return { ok: false, code: "invalid_companions" };

  if (rawCompanions.length > 0 && !settings.allowMultipleTickets) {
    return { ok: false, code: "multiple_tickets_not_allowed" };
  }

  const seats = 1 + rawCompanions.length;
  // Without a maximum an event sells one seat; "unlimited" is never implicit.
  const max = settings.allowMultipleTickets ? (settings.maxTicketsPerRegistration ?? 1) : 1;
  if (seats > max) return { ok: false, code: "too_many_tickets" };

  const companions: EventCompanionPayload[] = [];
  for (const entry of rawCompanions) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, code: "invalid_companions" };
    }
    const source = entry as Record<string, unknown>;
    const firstName = String(source.firstName ?? "").trim();
    const lastName = String(source.lastName ?? "").trim();
    if (!firstName || !lastName) return { ok: false, code: "companion_name_required" };

    // Only what the event asked for is carried forward, so a crafted payload
    // cannot store identity data the buyer was never shown a field for.
    const companion: EventCompanionPayload = {
      firstName,
      lastName,
      fieldValues: Array.isArray(source.fieldValues)
        ? (source.fieldValues as EventCompanionPayload["fieldValues"])
        : [],
    };
    if (settings.companionCollectDni) {
      const dni = String(source.dniOrPassport ?? "").trim();
      if (dni) companion.dniOrPassport = dni;
    }
    if (settings.companionCollectEmail) {
      const email = String(source.email ?? "").trim().toLowerCase();
      if (email) companion.email = email;
    }
    if (settings.companionCollectBirthDate) {
      const birthDate = String(source.birthDate ?? "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) companion.birthDate = birthDate;
    }
    companions.push(companion);
  }

  return { ok: true, ticketPackageId: requested, companions };
}
