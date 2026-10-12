import type { SupabaseClient } from "@supabase/supabase-js";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";
import {
  HOME_EVENT_POPUP_LIMIT,
  selectHomePopupEvents,
} from "@/lib/events/selectHomePopupEvents";
import { loadEventTranslationsByIds } from "@/lib/events/server/loadEventTranslations";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveEventCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";

export interface HomeEventPopupEvent {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  eventDate: string;
  location: string | null;
  currency: string;
  price: number | null;
  priceLocal: number | null;
  priceNonLocal: number | null;
}

const EXCERPT_MAX = 160;

function excerptFromHtml(html: string): string {
  const plain = htmlToPlain(html);
  if (plain.length <= EXCERPT_MAX) return plain;
  return `${plain.slice(0, EXCERPT_MAX).trimEnd()}…`;
}

export async function loadHomeEventPopup(
  supabase: SupabaseClient,
  locale: string,
  now = new Date(),
): Promise<HomeEventPopupEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, event_date, location, price, price_local, price_non_local, currency, default_locale, status, archived_at, private_to_section, show_on_home",
    )
    .eq("show_on_home", true)
    .eq("status", "published")
    .eq("private_to_section", false)
    .is("archived_at", null)
    .gte("event_date", now.toISOString())
    .order("event_date", { ascending: true })
    .limit(HOME_EVENT_POPUP_LIMIT);

  if (error) {
    logSupabaseClientError("loadHomeEventPopup", error);
    return [];
  }

  const candidates = (data ?? []).map((row) => ({
    row,
    id: String(row.id),
    status: String(row.status ?? ""),
    archivedAt: row.archived_at == null ? null : String(row.archived_at),
    privateToSection: Boolean(row.private_to_section),
    showOnHome: Boolean(row.show_on_home),
    eventDate: String(row.event_date ?? ""),
  }));
  const selected = selectHomePopupEvents(candidates, now);
  const translations = await loadEventTranslationsByIds(
    supabase,
    selected.map((item) => item.id),
  );

  return selected.map((item) => {
    const source = item.row;
    const defaultLocale = isEventLocale(String(source.default_locale ?? "es"))
      ? (String(source.default_locale) as EventLocale)
      : "es";
    const resolved = resolveEventTranslation(
      translations.get(item.id) ?? [],
      {
        title: String(source.title ?? ""),
        description: String(source.description ?? ""),
        location: source.location != null ? String(source.location) : null,
        defaultLocale,
      },
      locale,
    );
    return {
      id: item.id,
      slug: String(source.slug ?? ""),
      title: resolved.title,
      excerpt: excerptFromHtml(resolved.description),
      coverImageUrl: resolveEventCoverImageUrl(resolved.description),
      eventDate: item.eventDate,
      location: resolved.location,
      currency: String(source.currency ?? "CLP"),
      price: source.price == null ? null : Number(source.price),
      priceLocal: source.price_local == null ? null : Number(source.price_local),
      priceNonLocal: source.price_non_local == null ? null : Number(source.price_non_local),
    };
  });
}
