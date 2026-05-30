import type { SupabaseClient } from "@supabase/supabase-js";
import { isEventLocale, type EventLocale, type EventTranslationRow } from "@/lib/events/domain";

export async function loadEventTranslations(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventTranslationRow[]> {
  const { data } = await supabase
    .from("event_translations")
    .select("locale, title, description, location")
    .eq("event_id", eventId);

  return (data ?? []).flatMap((row) => {
    const locale = String(row.locale ?? "");
    if (!isEventLocale(locale)) return [];
    return [
      {
        locale,
        title: String(row.title ?? ""),
        description: String(row.description ?? ""),
        location: row.location != null ? String(row.location) : null,
      },
    ];
  });
}

export async function loadEventTranslationsByIds(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Map<string, EventTranslationRow[]>> {
  if (eventIds.length === 0) return new Map();

  const { data } = await supabase
    .from("event_translations")
    .select("event_id, locale, title, description, location")
    .in("event_id", eventIds);

  const grouped = new Map<string, EventTranslationRow[]>();
  for (const row of data ?? []) {
    const locale = String(row.locale ?? "");
    if (!isEventLocale(locale)) continue;
    const eventId = String(row.event_id);
    const list = grouped.get(eventId) ?? [];
    list.push({
      locale,
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      location: row.location != null ? String(row.location) : null,
    });
    grouped.set(eventId, list);
  }
  return grouped;
}

export function emptyEventTranslations(defaultLocale: EventLocale): Record<EventLocale, EventTranslationRow> {
  return {
    es: { locale: "es", title: "", description: "", location: null },
    en: { locale: "en", title: "", description: "", location: null },
    pt: { locale: "pt", title: "", description: "", location: null },
  };
}

export function mergeEventTranslations(
  rows: EventTranslationRow[],
): Record<EventLocale, EventTranslationRow> {
  const merged = emptyEventTranslations("es");
  for (const row of rows) {
    merged[row.locale] = row;
  }
  return merged;
}
