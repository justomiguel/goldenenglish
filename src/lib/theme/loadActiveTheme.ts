import { unstable_cache } from "next/cache";
import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import { logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  type ActiveThemeSnapshot,
  type LandingSectionSlug,
  LANDING_SECTION_SLUGS,
  SITE_THEME_ACTIVE_CACHE_TAG,
  type SiteThemeContent,
  type SiteThemeMediaRow,
  type SiteThemeRow,
  type ThemePropertyOverrides,
} from "@/types/theming";

/**
 * Reads the single `is_active = true` row in `public.site_themes` plus its
 * media. Cookieless / read-only: uses the anon client so the result is the
 * same for every visitor and fits inside `unstable_cache` (which forbids
 * `cookies()` access). The RLS policy `site_themes_select_active` exposes the
 * active row to anon, so no service role is needed.
 *
 * Returns `null` when:
 *  - Supabase env not configured (local CI without DB).
 *  - No active theme exists.
 *  - DB / network error (logged as `[ge:server]`, never throws — landing must
 *    keep rendering with `system.properties` defaults).
 */
async function loadActiveThemeUncached(): Promise<ActiveThemeSnapshot | null> {
  let client;
  try {
    client = createAnonReadOnlyClient();
  } catch (err) {
    logServerException("loadActiveTheme:client", err);
    return null;
  }
  if (!client) return null;

  const { data: themeRow, error: themeErr } = await client
    .from("site_themes")
    .select(
      "id, slug, name, is_active, properties, content, archived_at, created_at, updated_at, updated_by",
    )
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (themeErr) {
    logSupabaseError("loadActiveTheme:select_theme", themeErr);
    return null;
  }
  if (!themeRow) return null;

  const theme: SiteThemeRow = {
    id: String(themeRow.id),
    slug: String(themeRow.slug),
    name: String(themeRow.name),
    isActive: Boolean(themeRow.is_active),
    properties: parseOverrides(themeRow.properties),
    content: parseContent(themeRow.content),
    archivedAt: themeRow.archived_at ? String(themeRow.archived_at) : null,
    createdAt: String(themeRow.created_at),
    updatedAt: String(themeRow.updated_at),
    updatedBy: themeRow.updated_by ? String(themeRow.updated_by) : null,
  };

  const { data: mediaRows, error: mediaErr } = await client
    .from("site_theme_media")
    .select("id, theme_id, section, position, storage_path, alt_es, alt_en")
    .eq("theme_id", theme.id)
    .order("section", { ascending: true })
    .order("position", { ascending: true });

  if (mediaErr) {
    logSupabaseError("loadActiveTheme:select_media", mediaErr, {
      themeId: theme.id,
    });
    return { theme, media: [] };
  }

  const media: SiteThemeMediaRow[] = (mediaRows ?? [])
    .filter((row): row is NonNullable<typeof row> => row != null)
    .filter((row) =>
      LANDING_SECTION_SLUGS.includes(String(row.section) as LandingSectionSlug),
    )
    .map((row) => ({
      id: String(row.id),
      themeId: String(row.theme_id),
      section: String(row.section) as LandingSectionSlug,
      position: Number.isFinite(row.position) ? Number(row.position) : 1,
      storagePath: String(row.storage_path),
      altEs: row.alt_es != null ? String(row.alt_es) : null,
      altEn: row.alt_en != null ? String(row.alt_en) : null,
    }));

  return { theme, media };
}

function parseOverrides(raw: unknown): ThemePropertyOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function parseContent(raw: unknown): SiteThemeContent {
  if (!raw || typeof raw !== "object") return {};
  return raw as SiteThemeContent;
}

/**
 * Cached entry point. Invalidated by `updateTag(SITE_THEME_ACTIVE_CACHE_TAG)`
 * from the admin actions that activate / edit the live theme.
 */
export const loadActiveTheme = unstable_cache(
  loadActiveThemeUncached,
  ["site-theme-active-v1"],
  { tags: [SITE_THEME_ACTIVE_CACHE_TAG], revalidate: 300 },
);
