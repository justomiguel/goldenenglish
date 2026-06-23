import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";
import { loadEventTranslations } from "@/lib/events/server/loadEventTranslations";

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
  collectBirthDate: boolean;
  fields: EventFormFieldDefinition[];
}

export async function loadEventForPublicLanding(
  supabase: SupabaseClient,
  slug: string,
  locale: string,
): Promise<PublicEventDetail | null> {
  const { data: eventRow } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, view_count, event_date, location, price, price_local, price_non_local, currency, capacity, default_locale, bank_transfer_instructions, collect_birth_date",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("archived_at", null)
    .maybeSingle();

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
      "id, field_key, field_type, label_i18n, help_text_i18n, options_i18n, required, max_file_size_bytes, allowed_mime_types",
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
  }));

  const priceLocal = resolveEventLocalPrice(priceSource);
  const priceNonLocal = resolveEventNonLocalPrice(priceSource);

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
    collectBirthDate: Boolean(eventRow.collect_birth_date),
    fields,
  };
}
