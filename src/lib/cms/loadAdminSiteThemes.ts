import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  isSiteThemeKind,
  parseLandingBlocks,
} from "@/lib/cms/landingBlocksCatalog";
import type {
  SiteThemeContent,
  SiteThemeRow,
  ThemePropertyOverrides,
} from "@/types/theming";

/** Hard cap consistent with `13-postgrest-pagination-bounded-queries`: this
 *  table is administered manually so the realistic ceiling is dozens of rows;
 *  100 keeps the admin page snappy without losing room to grow. */
export const ADMIN_SITE_THEME_PAGE_SIZE = 100;

export interface LoadAdminSiteThemesResult {
  rows: SiteThemeRow[];
  total: number;
  truncated: boolean;
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
 * Server-only: lists site themes for the admin CMS hub. Receives the Supabase
 * client from `assertAdmin()` so this module stays infrastructure-agnostic
 * (the caller decides whether it has admin context). Active row first, then
 * unarchived by recency, archived rows pushed to the end.
 */
export async function loadAdminSiteThemes(
  supabase: SupabaseClient,
  { includeArchived = true }: { includeArchived?: boolean } = {},
): Promise<LoadAdminSiteThemesResult> {
  let query = supabase
    .from("site_themes")
    .select(
      "id, slug, name, is_active, template_kind, properties, content, blocks, archived_at, created_at, updated_at, updated_by",
      { count: "exact" },
    )
    .order("is_active", { ascending: false })
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .range(0, ADMIN_SITE_THEME_PAGE_SIZE - 1);

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error, count } = await query;
  if (error) {
    logSupabaseError("loadAdminSiteThemes", error);
    return { rows: [], total: 0, truncated: false };
  }

  const rows = (data ?? []).map((row) => mapRow(row as ThemeRowFromDb));
  const total = count ?? rows.length;
  return {
    rows,
    total,
    truncated: total > rows.length,
  };
}
