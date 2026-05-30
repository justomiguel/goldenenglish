import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";
import { loadEventTranslationsByIds } from "@/lib/events/server/loadEventTranslations";
import { resolveEventCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";

export interface PublicEventListRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  eventDate: string;
  location: string | null;
  capacity: number;
  price: number | null;
  priceLocal: number | null;
  priceNonLocal: number | null;
  hasTieredPricing: boolean;
  currency: string;
}

export interface PublicEventsListResult {
  rows: PublicEventListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function loadPublicEventsList(
  supabase: SupabaseClient,
  locale: string,
  page = 1,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
): Promise<PublicEventsListResult> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const [dataResult, countResult] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, description, event_date, location, capacity, price, price_local, price_non_local, currency, default_locale",
      )
      .eq("status", "published")
      .is("archived_at", null)
      .order("event_date", { ascending: true })
      .range(from, to),
    supabase
      .from("events")
      .select("id", { head: true, count: "exact" })
      .eq("status", "published")
      .is("archived_at", null),
  ]);

  const rawRows = dataResult.data ?? [];
  const translationsByEvent = await loadEventTranslationsByIds(
    supabase,
    rawRows.map((row) => String(row.id)),
  );

  const rows: PublicEventListRow[] = rawRows.map((row) => {
    const defaultLocale = isEventLocale(String(row.default_locale ?? "es"))
      ? (String(row.default_locale) as EventLocale)
      : "es";
    const resolved = resolveEventTranslation(
      translationsByEvent.get(String(row.id)) ?? [],
      {
        title: String(row.title),
        description: String(row.description ?? ""),
        location: row.location != null ? String(row.location) : null,
        defaultLocale,
      },
      locale,
    );
    const priceSource = {
      price: row.price == null ? null : Number(row.price),
      priceLocal: row.price_local == null ? null : Number(row.price_local),
      priceNonLocal: row.price_non_local == null ? null : Number(row.price_non_local),
    };
    const priceLocal = resolveEventLocalPrice(priceSource);
    const priceNonLocal = resolveEventNonLocalPrice(priceSource);

    return {
      id: String(row.id),
      slug: String(row.slug),
      title: resolved.title,
      description: resolved.description,
      coverImageUrl: resolveEventCoverImageUrl(resolved.description),
      eventDate: String(row.event_date ?? ""),
      location: resolved.location,
      capacity: Number(row.capacity ?? 0),
      price: priceLocal,
      priceLocal,
      priceNonLocal,
      hasTieredPricing: eventHasTieredPricing(priceSource),
      currency: String(row.currency ?? "CLP"),
    };
  });

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page: safePage,
    pageSize,
  };
}
