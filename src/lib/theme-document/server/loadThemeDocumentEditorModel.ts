import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isSiteThemeKind } from "@/lib/cms/landingBlocksCatalog";
import type { SkinLocale } from "@/lib/landing/skin/skinModel";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import { pickEditorDocument } from "@/lib/theme-document/pickEditorDocument";
import type { ThemeProperties } from "@/lib/theme/themeParser";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeKind } from "@/types/theming";

export interface EditorVersionRow {
  id: string;
  version: number;
  publishedOn: string;
  author: string;
  documentHash: string;
}

function propertiesOf(value: unknown): ThemeProperties {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: ThemeProperties = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") out[key] = item;
  }
  return out;
}

function kindOf(value: unknown): SiteThemeKind {
  return isSiteThemeKind(value) ? value : "classic";
}

function skinLocale(locale: string): SkinLocale {
  if (locale === "en" || locale === "pt") return locale;
  return "es";
}

export async function loadThemeDocumentEditorModel(
  client: SupabaseClient,
  siteThemeId: string,
  dict: Dictionary,
  locale: string,
) {
  const theme = await client
    .from("site_themes")
    .select("id, properties, skin_content, template_kind")
    .eq("id", siteThemeId)
    .maybeSingle();
  if (theme.error || !theme.data) {
    await logServerWarn("themeDocument.read", { code: "theme_missing", siteThemeId });
    return null;
  }
  const [draft, published, versions] = await Promise.all([
    client
      .from("theme_documents")
      .select("document, document_hash")
      .eq("site_theme_id", siteThemeId)
      .eq("status", "draft")
      .limit(1),
    client
      .from("theme_documents")
      .select("document")
      .eq("site_theme_id", siteThemeId)
      .eq("status", "published")
      .order("version", { ascending: false })
      .limit(1),
    client
      .from("theme_documents")
      .select("id, version, document_hash, published_at, published_by")
      .eq("site_theme_id", siteThemeId)
      .eq("status", "published")
      .order("version", { ascending: false })
      .limit(20),
  ]);
  if (draft.error || published.error || versions.error) {
    await logServerWarn("themeDocument.read", { code: "rpc_failed", siteThemeId });
  }
  const draftRow = draft.data?.[0] as { document?: unknown; document_hash?: string | null } | undefined;
  const publishedRow = published.data?.[0] as { document?: unknown } | undefined;
  const legacy = legacyThemeToDocument(
    {
      properties: propertiesOf(theme.data.properties),
      skin_content: theme.data.skin_content,
      template_kind: kindOf(theme.data.template_kind),
    },
    { dict, locale: skinLocale(locale) },
  );
  const picked = pickEditorDocument({
    draft: draftRow ? { document: draftRow.document, documentHash: draftRow.document_hash ?? null } : null,
    published: publishedRow?.document ?? null,
    legacy,
  });
  const rows: EditorVersionRow[] = ((versions.data ?? []) as Array<{
    id: string;
    version: number;
    document_hash: string;
    published_at: string | null;
    published_by: string | null;
  }>).map((row) => ({
    id: row.id,
    version: row.version,
    publishedOn: row.published_at ?? "",
    author: row.published_by ?? "—",
    documentHash: row.document_hash,
  }));
  return { ...picked, versions: rows };
}
