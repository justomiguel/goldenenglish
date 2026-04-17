import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import {
  buildRawPropertyRows,
  type RawPropertyRow,
} from "@/lib/cms/buildRawPropertyRows";
import {
  isSiteThemeKind,
  parseLandingBlocks,
} from "@/lib/cms/landingBlocksCatalog";
import type {
  SiteThemeContent,
  SiteThemeRow,
  ThemePropertyOverrides,
} from "@/types/theming";

export interface SiteThemeRawEditorViewModel {
  theme: SiteThemeRow;
  /** Full merged view (defaults + overrides) restricted to the allow-list. */
  rows: ReadonlyArray<RawPropertyRow>;
}

interface ThemeRowFromDb {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  template_kind: unknown;
  properties: unknown;
  content: unknown;
  blocks: unknown;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
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

function mapRow(row: ThemeRowFromDb): SiteThemeRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    isActive: Boolean(row.is_active),
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

/**
 * Server-only loader for the raw properties editor (PR 5).
 *
 * Reuses the same row shape as the grouped editor, but delivers the full
 * allow-listed catalog (defaults + extra override keys) so the admin can
 * inspect or override any property from a flat table.
 */
export async function loadSiteThemeForRawEditor(
  supabase: SupabaseClient,
  themeId: string,
): Promise<SiteThemeRawEditorViewModel | null> {
  const { data, error } = await supabase
    .from("site_themes")
    .select(
      "id, slug, name, is_active, template_kind, properties, content, blocks, archived_at, created_at, updated_at, updated_by",
    )
    .eq("id", themeId)
    .maybeSingle();

  if (error) {
    logSupabaseError("loadSiteThemeForRawEditor", error);
    return null;
  }
  if (!data) return null;

  const theme = mapRow(data as ThemeRowFromDb);
  const defaults = loadProperties();
  const rows = buildRawPropertyRows(defaults, theme.properties);
  return { theme, rows };
}
