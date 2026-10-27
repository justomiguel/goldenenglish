import type { SupabaseClient } from "@supabase/supabase-js";
import { eventPublicLandingFilters } from "@/lib/dashboard/events/eventPublicLandingFilters";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import { resolveRegistrationFieldOrder } from "@/lib/events/registrationFieldOrder";
import {
  loadActiveRegistrationFlows,
  registrationFlowName,
} from "@/lib/events/server/loadActiveRegistrationFlows";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";
import { loadEventTranslations } from "@/lib/events/server/loadEventTranslations";
import {
  loadEventTicketPackages,
  loadEventTicketPackageSeatsSold,
} from "@/lib/events/server/loadEventTicketPackages";
import {
  parseEventBankTransferSourcesConfig,
  type EventBankTransferSourcesConfig,
} from "@/lib/events/eventBankTransferSources";
import {
  parseEventSeatMapConfig,
  stripEventSeatMapGuideImages,
  type EventSeatMapConfig,
} from "@/lib/events/seatMapModel";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface PublicEventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  viewCount: number;
  eventDate: string;
  location: string | null;
  price: number | null;
  priceLocal: number | null;
  priceNonLocal: number | null;
  hasTieredPricing: boolean;
  currency: string;
  capacity: number;
  defaultLocale: EventLocale;
  localeUsed: EventLocale;
  bankTransferInstructions: string | null;
  globalBankTransferInstructions?: string | null;
  bankTransferSourcesConfig?: EventBankTransferSourcesConfig | null;
  allowFamilyDiscount?: boolean;
  allowMinorTickets?: boolean;
  minorTicketPrice?: number | null;
  seatMapConfig?: EventSeatMapConfig | null;
  seatLocks?: EventSeatLockSnapshot[];
  collectBirthDate: boolean;
  requirePhone: boolean;
  requireBirthDate: boolean;
  questionOrder: string[];
  priceByFlow: boolean;
  flows: PublicEventRegistrationFlow[];
  fields: EventFormFieldDefinition[];
  allowMultipleTickets: boolean;
  maxTicketsPerRegistration: number | null;
  companionRequireDetails?: boolean;
  companionCollectDni: boolean;
  companionCollectBirthDate: boolean;
  companionCollectEmail: boolean;
  /** Non-archived packages. A non-empty list means the event is in package mode. */
  packages: PublicEventPackage[];
}

export interface PublicEventRegistrationFlow {
  id: string;
  name: string;
  price: number | null;
  fieldOrder: string[];
}

export interface PublicEventPackage {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  /** Null when the package has no capacity of its own. */
  remainingSeats: number | null;
}

export async function loadEventForPublicLanding(
  supabase: SupabaseClient,
  slug: string,
  locale: string,
  options?: { eventId?: string; includeUnpublished?: boolean },
): Promise<PublicEventDetail | null> {
  const lookup = eventPublicLandingFilters({
    slug,
    eventId: options?.eventId,
    includeUnpublished: options?.includeUnpublished,
  });
  let request = supabase
    .from("events")
    .select(
      "id, slug, title, description, view_count, event_date, location, price, price_local, price_non_local, currency, capacity, default_locale, bank_transfer_instructions, bank_transfer_sources_config, allow_family_discount, allow_minor_tickets, minor_ticket_price, seat_map_config, collect_birth_date, require_phone, require_birth_date, registration_field_order, price_by_flow, allow_multiple_tickets, max_tickets_per_registration, companion_require_details, companion_collect_dni, companion_collect_birth_date, companion_collect_email",
    )
    .is("archived_at", null);
  request = lookup.column === "id" ? request.eq("id", lookup.value) : request.eq("slug", lookup.value);
  if (lookup.publishedOnly) request = request.eq("status", "published");
  const { data: eventRow, error: eventError } = await request.maybeSingle();
  if (eventError) {
    logSupabaseClientError("loadEventForPublicLanding:event", eventError, {
      slug,
      eventId: options?.eventId ?? null,
    });
  }

  if (!eventRow?.id) return null;

  const defaultLocale = isEventLocale(String(eventRow.default_locale ?? "es"))
    ? (String(eventRow.default_locale) as EventLocale)
    : "es";

  const translations = await loadEventTranslations(supabase, String(eventRow.id));
  const resolved = resolveEventTranslation(
    translations,
    {
      title: String(eventRow.title),
      description: String(eventRow.description ?? ""),
      location: eventRow.location != null ? String(eventRow.location) : null,
      defaultLocale,
    },
    locale,
  );

  const priceSource = {
    price: eventRow.price == null ? null : Number(eventRow.price),
    priceLocal: eventRow.price_local == null ? null : Number(eventRow.price_local),
    priceNonLocal: eventRow.price_non_local == null ? null : Number(eventRow.price_non_local),
  };

  const { data: fieldsRows } = await supabase
    .from("event_form_fields")
    .select(
      "id, field_key, field_type, label_i18n, help_text_i18n, options_i18n, required, position, flow_id, max_file_size_bytes, allowed_mime_types",
    )
    .eq("event_id", eventRow.id)
    .is("archived_at", null)
    .order("position", { ascending: true });

  const fields: EventFormFieldDefinition[] = (fieldsRows ?? []).map((row) => ({
    id: String(row.id),
    fieldKey: String(row.field_key),
    fieldType: row.field_type as EventFormFieldDefinition["fieldType"],
    labelI18n: (row.label_i18n as Record<string, string>) ?? {},
    helpTextI18n: (row.help_text_i18n as Record<string, string>) ?? {},
    optionsI18n: (row.options_i18n as Record<string, string[]>) ?? {},
    required: Boolean(row.required),
    maxFileSizeBytes: Number(row.max_file_size_bytes ?? 26214400),
    allowedMimeTypes: ((row.allowed_mime_types as string[] | null) ?? []).map((item) =>
      item.toLowerCase(),
    ),
    flowId: row.flow_id == null ? null : String(row.flow_id),
    position: Number(row.position ?? 0),
  }));

  const priceLocal = resolveEventLocalPrice(priceSource);
  const priceNonLocal = resolveEventNonLocalPrice(priceSource);

  const [packageRows, seatsSold, registrationFlows] = await Promise.all([
    loadEventTicketPackages(supabase, String(eventRow.id)),
    loadEventTicketPackageSeatsSold(supabase, String(eventRow.id)),
    loadActiveRegistrationFlows(supabase, String(eventRow.id)),
  ]);

  const packages: PublicEventPackage[] = packageRows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    benefits: row.benefits,
    remainingSeats:
      row.capacity == null ? null : Math.max(0, row.capacity - (seatsSold.get(row.id) ?? 0)),
  }));

  return {
    id: String(eventRow.id),
    slug: String(eventRow.slug),
    title: resolved.title,
    description: resolved.description,
    viewCount: Number(eventRow.view_count ?? 0),
    eventDate: String(eventRow.event_date ?? ""),
    location: resolved.location,
    price: priceLocal,
    priceLocal,
    priceNonLocal,
    hasTieredPricing: eventHasTieredPricing(priceSource),
    currency: String(eventRow.currency ?? "CLP"),
    capacity: Number(eventRow.capacity ?? 0),
    defaultLocale,
    localeUsed: resolved.localeUsed,
    bankTransferInstructions:
      eventRow.bank_transfer_instructions == null
        ? null
        : String(eventRow.bank_transfer_instructions),
    bankTransferSourcesConfig: parseEventBankTransferSourcesConfig(
      eventRow.bank_transfer_sources_config,
    ),
    allowFamilyDiscount: Boolean(eventRow.allow_family_discount),
    seatMapConfig: (() => {
      const parsed = parseEventSeatMapConfig(eventRow.seat_map_config);
      return parsed ? stripEventSeatMapGuideImages(parsed) : null;
    })(),
    collectBirthDate: Boolean(eventRow.collect_birth_date),
    requirePhone: Boolean(eventRow.require_phone),
    requireBirthDate: Boolean(eventRow.require_birth_date),
    questionOrder: resolveRegistrationFieldOrder({
      stored: Array.isArray(eventRow.registration_field_order)
        ? eventRow.registration_field_order.map((token) => String(token))
        : [],
      extras: fields
        .filter((field) => registrationFlows.length === 0 || field.flowId == null)
        .map((field) => ({ id: field.id, position: field.position ?? 0 })),
      collectBirthDate: Boolean(eventRow.collect_birth_date),
    }),
    priceByFlow: Boolean(eventRow.price_by_flow),
    flows: registrationFlows.map((flow) => ({
      id: flow.id,
      name: registrationFlowName(flow.nameI18n, locale, defaultLocale),
      price: flow.price,
      fieldOrder: flow.fieldOrder,
    })),
    fields,
    allowMinorTickets: Boolean(eventRow.allow_minor_tickets),
    minorTicketPrice: eventRow.minor_ticket_price == null ? null : Number(eventRow.minor_ticket_price),
    allowMultipleTickets: Boolean(eventRow.allow_multiple_tickets),
    maxTicketsPerRegistration:
      eventRow.max_tickets_per_registration == null
        ? null
        : Number(eventRow.max_tickets_per_registration),
    companionRequireDetails: Boolean(eventRow.companion_require_details),
    companionCollectDni: Boolean(eventRow.companion_collect_dni),
    companionCollectBirthDate: Boolean(eventRow.companion_collect_birth_date),
    companionCollectEmail: Boolean(eventRow.companion_collect_email),
    packages,
  };
}
