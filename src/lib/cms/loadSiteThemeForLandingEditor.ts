import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  buildLandingEditorOverview,
  buildLandingSectionEditorViewModel,
  type LandingEditorOverviewItem,
  type LandingSectionEditorViewModel,
} from "@/lib/cms/buildLandingEditorViewModel";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import {
  isSiteThemeKind,
  parseLandingBlocks,
} from "@/lib/cms/landingBlocksCatalog";
import {
  LANDING_SECTION_SLUGS,
  type LandingSectionSlug,
  type SiteThemeContent,
  type SiteThemeMediaRow,
  type SiteThemeRow,
  type ThemePropertyOverrides,
} from "@/types/theming";

interface ThemeRowFromDb {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_system_default: boolean | null;
  template_kind: unknown;
  properties: unknown;
  content: unknown;
  blocks: unknown;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface MediaRowFromDb {
  id: string;
  theme_id: string;
  section: string;
  position: number;
  storage_path: string;
  alt_es: string | null;
  alt_en: string | null;
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

function mapTheme(row: ThemeRowFromDb): SiteThemeRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    isActive: Boolean(row.is_active),
    isSystemDefault: Boolean(row.is_system_default),
    templateKind: isSiteThemeKind(row.template_kind) ? row.template_kind : "classic",
    properties: parseOverrides(row.properties),
    content: parseContent(row.content),
    blocks: parseLandingBlocks(row.blocks),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
  };
}

function mapMedia(rows: ReadonlyArray<MediaRowFromDb>): SiteThemeMediaRow[] {
  return rows
    .filter((row) =>
      LANDING_SECTION_SLUGS.includes(row.section as LandingSectionSlug),
    )
    .map((row) => ({
      id: String(row.id),
      themeId: String(row.theme_id),
      section: row.section as LandingSectionSlug,
      position: Number.isFinite(row.position) ? Number(row.position) : 1,
      storagePath: String(row.storage_path),
      altEs: row.alt_es != null ? String(row.alt_es) : null,
      altEn: row.alt_en != null ? String(row.alt_en) : null,
    }));
}

async function loadDictionaries(): Promise<
  Record<LandingOverrideLocale, Awaited<ReturnType<typeof getDictionary>>>
> {
  const [es, en] = await Promise.all([getDictionary("es"), getDictionary("en")]);
  return { es, en };
}

interface BaseSnapshot {
  theme: SiteThemeRow;
  media: ReadonlyArray<SiteThemeMediaRow>;
}

async function fetchThemeAndMedia(
  supabase: SupabaseClient,
  themeId: string,
): Promise<BaseSnapshot | null> {
  const { data: themeData, error: themeErr } = await supabase
    .from("site_themes")
    .select(
      "id, slug, name, is_active, is_system_default, template_kind, properties, content, blocks, archived_at, created_at, updated_at, updated_by",
    )
    .eq("id", themeId)
    .maybeSingle();
  if (themeErr) {
    logSupabaseError("loadSiteThemeForLandingEditor:theme", themeErr);
    return null;
  }
  if (!themeData) return null;

  const { data: mediaData, error: mediaErr } = await supabase
    .from("site_theme_media")
    .select("id, theme_id, section, position, storage_path, alt_es, alt_en")
    .eq("theme_id", themeId)
    .order("section", { ascending: true })
    .order("position", { ascending: true });
  if (mediaErr) {
    logSupabaseError("loadSiteThemeForLandingEditor:media", mediaErr, {
      themeId,
    });
  }

  return {
    theme: mapTheme(themeData as ThemeRowFromDb),
    media: mapMedia((mediaData ?? []) as ReadonlyArray<MediaRowFromDb>),
  };
}

export interface LandingEditorOverviewViewModel {
  theme: SiteThemeRow;
  sections: ReadonlyArray<LandingEditorOverviewItem>;
}

export async function loadLandingEditorOverview(
  supabase: SupabaseClient,
  themeId: string,
): Promise<LandingEditorOverviewViewModel | null> {
  const snapshot = await fetchThemeAndMedia(supabase, themeId);
  if (!snapshot) return null;
  const defaults = await loadDictionaries();
  const sections = buildLandingEditorOverview({
    defaults,
    content: snapshot.theme.content,
    media: snapshot.media,
    blocks: snapshot.theme.blocks,
    resolveMediaPublicUrl: createLandingMediaPublicUrlBuilder(),
  });
  return { theme: snapshot.theme, sections };
}

export interface LandingEditorSectionViewModel {
  theme: SiteThemeRow;
  section: LandingSectionEditorViewModel;
}

export async function loadLandingEditorSection(
  supabase: SupabaseClient,
  themeId: string,
  section: LandingSectionSlug,
): Promise<LandingEditorSectionViewModel | null> {
  const snapshot = await fetchThemeAndMedia(supabase, themeId);
  if (!snapshot) return null;
  const defaults = await loadDictionaries();
  const view = buildLandingSectionEditorViewModel(section, {
    defaults,
    content: snapshot.theme.content,
    media: snapshot.media,
    blocks: snapshot.theme.blocks,
    resolveMediaPublicUrl: createLandingMediaPublicUrlBuilder(),
  });
  return { theme: snapshot.theme, section: view };
}
