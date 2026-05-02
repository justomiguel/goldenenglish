import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  isSiteThemeKind,
  parseLandingBlocks,
} from "@/lib/cms/landingBlocksCatalog";
import { getSiteBrandThemeSlug } from "@/lib/theme/siteBrandThemeSlug";
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

const THEME_SELECT_FIELDS =
  "id, slug, name, is_active, is_system_default, template_kind, properties, content, blocks, archived_at, created_at, updated_at, updated_by";

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

function mapRowToTheme(themeRow: {
  id: unknown;
  slug: unknown;
  name: unknown;
  is_active: unknown;
  is_system_default: unknown;
  template_kind: unknown;
  properties: unknown;
  content: unknown;
  blocks: unknown;
  archived_at: unknown;
  created_at: unknown;
  updated_at: unknown;
  updated_by: unknown;
}): SiteThemeRow {
  return {
    id: String(themeRow.id),
    slug: String(themeRow.slug),
    name: String(themeRow.name),
    isActive: Boolean(themeRow.is_active),
    isSystemDefault: Boolean(themeRow.is_system_default),
    templateKind: isSiteThemeKind(themeRow.template_kind)
      ? themeRow.template_kind
      : "classic",
    properties: parseOverrides(themeRow.properties),
    content: parseContent(themeRow.content),
    blocks: parseLandingBlocks(themeRow.blocks),
    archivedAt: themeRow.archived_at ? String(themeRow.archived_at) : null,
    createdAt: String(themeRow.created_at),
    updatedAt: String(themeRow.updated_at),
    updatedBy: themeRow.updated_by ? String(themeRow.updated_by) : null,
  };
}

async function loadMediaForTheme(
  client: SupabaseClient,
  themeId: string,
): Promise<{ media: SiteThemeMediaRow[]; mediaErr: boolean }> {
  const { data: mediaRows, error: mediaErr } = await client
    .from("site_theme_media")
    .select("id, theme_id, section, position, storage_path, alt_es, alt_en")
    .eq("theme_id", themeId)
    .order("section", { ascending: true })
    .order("position", { ascending: true });

  if (mediaErr) {
    logSupabaseError("loadActiveTheme:select_media", mediaErr, {
      themeId,
    });
    return { media: [], mediaErr: true };
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
  return { media, mediaErr: false };
}

async function loadThemeBySlugWithClient(
  client: SupabaseClient,
  slug: string,
): Promise<ActiveThemeSnapshot | null> {
  const { data: themeRow, error: themeErr } = await client
    .from("site_themes")
    .select(THEME_SELECT_FIELDS)
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();

  if (themeErr) {
    logSupabaseError("loadActiveTheme:select_theme_by_slug", themeErr, {
      slug,
    });
    return null;
  }
  if (!themeRow) return null;

  const theme = mapRowToTheme(themeRow);
  const { media } = await loadMediaForTheme(client, theme.id);
  return { theme, media };
}

async function loadActiveThemeRowAnon(
  client: SupabaseClient,
): Promise<ActiveThemeSnapshot | null> {
  const { data: themeRow, error: themeErr } = await client
    .from("site_themes")
    .select(THEME_SELECT_FIELDS)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (themeErr) {
    logSupabaseError("loadActiveTheme:select_theme", themeErr);
    return null;
  }
  if (!themeRow) return null;

  const theme = mapRowToTheme(themeRow);
  const { media } = await loadMediaForTheme(client, theme.id);
  return { theme, media };
}

/**
 * Reads the active `site_themes` row (anon) plus its media, or — when
 * `SITE_BRAND_THEME_SLUG` is set and `SUPABASE_SERVICE_ROLE_KEY` exists —
 * resolves by slug with the service role so dedicated deploys can brand without
 * toggling `is_active` on shared migration history.
 */
async function loadActiveThemeUncached(): Promise<ActiveThemeSnapshot | null> {
  const brandSlug = getSiteBrandThemeSlug();
  if (brandSlug) {
    try {
      const admin = createAdminClient();
      const bySlug = await loadThemeBySlugWithClient(admin, brandSlug);
      if (bySlug) return bySlug;
    } catch (err) {
      logServerException("loadActiveTheme:admin_client", err);
    }
  }

  let client;
  try {
    client = createAnonReadOnlyClient();
  } catch (err) {
    logServerException("loadActiveTheme:client", err);
    return null;
  }
  if (!client) return null;
  return loadActiveThemeRowAnon(client);
}

export const loadActiveTheme = unstable_cache(
  loadActiveThemeUncached,
  [
    "site-theme-active-v2",
    process.env.SITE_BRAND_THEME_SLUG?.trim() ?? "",
  ],
  { tags: [SITE_THEME_ACTIVE_CACHE_TAG], revalidate: 300 },
);
