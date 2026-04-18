import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import {
  groupThemeTokens,
  type TokenGroup,
} from "@/lib/cms/groupThemeTokens";
import {
  isSiteThemeKind,
  parseLandingBlocks,
} from "@/lib/cms/landingBlocksCatalog";
import type {
  SiteThemeContent,
  SiteThemeRow,
  ThemePropertyOverrides,
} from "@/types/theming";

export interface SiteThemeEditorViewModel {
  theme: SiteThemeRow;
  groups: ReadonlyArray<TokenGroup>;
}

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

/**
 * Server-only loader that powers the design system editor.
 *
 * Reads `system.properties` for defaults (single source of truth per
 * `01-design-system.mdc`) and combines them with the row's `properties`
 * overrides so the editor can render the full token catalog with current
 * values + reset affordances.
 *
 * Caller passes the Supabase client (`assertAdmin().supabase`) to keep this
 * module infrastructure-agnostic, per `12-supabase-app-boundaries.mdc`.
 */
export async function loadSiteThemeForEditor(
  supabase: SupabaseClient,
  themeId: string,
): Promise<SiteThemeEditorViewModel | null> {
  const { data, error } = await supabase
    .from("site_themes")
    .select(
      "id, slug, name, is_active, is_system_default, template_kind, properties, content, blocks, archived_at, created_at, updated_at, updated_by",
    )
    .eq("id", themeId)
    .maybeSingle();

  if (error) {
    logSupabaseError("loadSiteThemeForEditor", error);
    return null;
  }
  if (!data) return null;

  const theme = mapRow(data as ThemeRowFromDb);
  const defaults = loadProperties();
  const groups = groupThemeTokens(defaults, theme.properties);
  return { theme, groups };
}
