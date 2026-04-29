import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  isBadgeCategory,
  isBadgeCriteriaType,
  isBadgeLocale,
  type BadgeCatalogEntry,
  type BadgeLocale,
  type BadgeTranslation,
} from "@/lib/badges/badgeCatalog";

interface CatalogRow {
  id: string;
  code: string;
  category: string;
  criteria_type: string;
  criteria_threshold: number | string;
  image_path: string | null;
  is_active: boolean;
  sort_order: number | string;
}

interface TranslationRow {
  badge_id: string;
  locale: string;
  title: string;
  description: string;
}

function decodeRow(
  row: CatalogRow,
  byBadge: Map<string, Partial<Record<BadgeLocale, BadgeTranslation>>>,
): BadgeCatalogEntry | null {
  if (!isBadgeCategory(row.category) || !isBadgeCriteriaType(row.criteria_type)) {
    return null;
  }
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    criteriaType: row.criteria_type,
    criteriaThreshold: Number(row.criteria_threshold) || 0,
    imagePath: row.image_path ?? null,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order) || 0,
    translations: byBadge.get(row.id) ?? {},
  };
}

async function fetchCatalogRowsAndTranslations(
  options: { activeOnly: boolean },
): Promise<{ rows: CatalogRow[]; translations: TranslationRow[] }> {
  const supabase = createAdminClient();
  const query = supabase
    .from("badge_catalog")
    .select(
      "id, code, category, criteria_type, criteria_threshold, image_path, is_active, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });
  const catalogQuery = options.activeOnly ? query.eq("is_active", true) : query;
  const { data: catalogRows, error: catalogErr } = await catalogQuery;
  if (catalogErr) {
    logSupabaseClientError("loadBadgeCatalog:catalog", catalogErr);
    return { rows: [], translations: [] };
  }
  const ids = (catalogRows ?? []).map((r) => r.id as string);
  if (ids.length === 0) return { rows: [], translations: [] };

  const { data: translationRows, error: translationsErr } = await supabase
    .from("badge_translations")
    .select("badge_id, locale, title, description")
    .in("badge_id", ids);
  if (translationsErr) {
    logSupabaseClientError("loadBadgeCatalog:translations", translationsErr);
    return { rows: catalogRows as CatalogRow[], translations: [] };
  }
  return {
    rows: catalogRows as CatalogRow[],
    translations: (translationRows ?? []) as TranslationRow[],
  };
}

function indexTranslations(rows: TranslationRow[]) {
  const byBadge = new Map<string, Partial<Record<BadgeLocale, BadgeTranslation>>>();
  for (const t of rows) {
    if (!isBadgeLocale(t.locale)) continue;
    const entry = byBadge.get(t.badge_id) ?? {};
    entry[t.locale] = { title: t.title, description: t.description };
    byBadge.set(t.badge_id, entry);
  }
  return byBadge;
}

/**
 * Active badge catalog (for evaluator + student/parent UIs).
 * Cached per request via React `cache()` so multiple consumers share a single read.
 */
export const loadActiveBadgeCatalog = cache(async (): Promise<BadgeCatalogEntry[]> => {
  const { rows, translations } = await fetchCatalogRowsAndTranslations({ activeOnly: true });
  const byBadge = indexTranslations(translations);
  return rows
    .map((r) => decodeRow(r, byBadge))
    .filter((e): e is BadgeCatalogEntry => e !== null);
});

/**
 * Full badge catalog including paused rows (admin only).
 * Caller is expected to gate with `assertAdmin` before exposing.
 */
export async function loadFullBadgeCatalog(): Promise<BadgeCatalogEntry[]> {
  const { rows, translations } = await fetchCatalogRowsAndTranslations({ activeOnly: false });
  const byBadge = indexTranslations(translations);
  return rows
    .map((r) => decodeRow(r, byBadge))
    .filter((e): e is BadgeCatalogEntry => e !== null);
}

/** Fetch a single catalog entry by id (admin edit page). */
export async function loadBadgeCatalogEntryById(
  badgeId: string,
): Promise<BadgeCatalogEntry | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("badge_catalog")
    .select(
      "id, code, category, criteria_type, criteria_threshold, image_path, is_active, sort_order",
    )
    .eq("id", badgeId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadBadgeCatalogEntryById:catalog", error, { badgeId });
    return null;
  }
  if (!data) return null;
  const { data: translations, error: tErr } = await supabase
    .from("badge_translations")
    .select("badge_id, locale, title, description")
    .eq("badge_id", badgeId);
  if (tErr) {
    logSupabaseClientError("loadBadgeCatalogEntryById:translations", tErr, { badgeId });
  }
  return decodeRow(
    data as CatalogRow,
    indexTranslations((translations ?? []) as TranslationRow[]),
  );
}
