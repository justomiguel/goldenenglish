import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import {
  isBadgeCategory,
  isBadgeLocale,
  type BadgeCategory,
  type BadgeLocale,
  type BadgeTranslation,
} from "@/lib/badges/badgeCatalog";

export type PublicBadgeCatalogEntry = {
  badgeId: string;
  code: string;
  category: BadgeCategory;
  imagePath: string | null;
  translations: Partial<Record<BadgeLocale, BadgeTranslation>>;
} | null;

const RPC_NAME = "get_public_badge_catalog_entry" as const;

interface RpcRow {
  badge_id?: unknown;
  code?: unknown;
  category?: unknown;
  image_path?: unknown;
  translations?: unknown;
}

function decodeTranslationsJson(
  raw: unknown,
): Partial<Record<BadgeLocale, BadgeTranslation>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<BadgeLocale, BadgeTranslation>> = {};
  for (const [locale, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isBadgeLocale(locale)) continue;
    if (!value || typeof value !== "object") continue;
    const v = value as { title?: unknown; description?: unknown };
    if (typeof v.title !== "string" || typeof v.description !== "string") continue;
    out[locale] = { title: v.title, description: v.description };
  }
  return out;
}

/**
 * Public-safe lookup of an active badge catalog entry by code.
 * Used by the share page and the OG image. Returns null when the badge is missing,
 * paused, or when public Supabase env is not configured.
 */
export async function loadPublicBadgeCatalogEntryByCode(
  code: string,
): Promise<PublicBadgeCatalogEntry> {
  if (typeof code !== "string" || code.length === 0 || code.length > 64) return null;
  const supabase = createAnonReadOnlyClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(RPC_NAME, { p_code: code });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | null | undefined;
  if (!row) return null;
  const badgeId = typeof row.badge_id === "string" ? row.badge_id : null;
  const code_ = typeof row.code === "string" ? row.code : null;
  if (!badgeId || !code_ || !isBadgeCategory(row.category)) return null;
  return {
    badgeId,
    code: code_,
    category: row.category,
    imagePath: typeof row.image_path === "string" && row.image_path.length > 0 ? row.image_path : null,
    translations: decodeTranslationsJson(row.translations),
  };
}
