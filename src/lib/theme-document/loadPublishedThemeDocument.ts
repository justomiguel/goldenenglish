import { unstable_cache } from "next/cache";
import { createAnonClientFromCredentials } from "@/lib/supabase/anon";
import { bindInstituteDataPlane } from "@/lib/supabase/bindInstituteDataPlane";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";
import { getTenantBySlug } from "@/lib/tenant/tenantRegistry";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import { themeDocumentV1Schema, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { siteThemeActiveCacheTagForTenant, type ActiveThemeSnapshot } from "@/types/theming";
import type { SiteThemeKind } from "@/types/theming";

export async function readPublishedThemeDocument(tenantSlug: string): Promise<{
  document: ThemeDocumentV1;
  source: "published" | "legacy";
}> {
  const tenant = getTenantBySlug(tenantSlug);
  if (!tenant) {
    await logServerWarn("themeDocument.read", { code: "tenant_missing" });
    return { document: legacyThemeToDocument({ properties: {}, skin_content: null, template_kind: "classic" }), source: "legacy" };
  }
  try {
    const client = bindInstituteDataPlane(
      createAnonClientFromCredentials(tenant.supabaseUrl, tenant.supabaseAnonKey),
      tenant,
    );
    const theme = await client
      .from("site_themes")
      .select("id, properties, skin_content, template_kind")
      .eq("is_active", true)
      .maybeSingle();
    if (theme.error || !theme.data) {
      await logServerWarn("themeDocument.read", { code: "theme_missing" });
      return { document: legacyThemeToDocument({ properties: {}, skin_content: null, template_kind: "classic" }), source: "legacy" };
    }
    const row = theme.data as { id: string; properties: Record<string, string>; skin_content: unknown; template_kind: SiteThemeKind };
    const rpc = await client.rpc("get_published_theme_document", { p_site_theme_id: row.id });
    if (rpc.error) {
      await logServerWarn("themeDocument.read", { code: "rpc_failed" });
      return { document: legacyThemeToDocument(row), source: "legacy" };
    }
    const parsed = themeDocumentV1Schema.safeParse(rpc.data);
    if (parsed.success) return { document: parsed.data, source: "published" };
    return { document: legacyThemeToDocument(row), source: "legacy" };
  } catch (err) {
    await logServerException("themeDocument.read", err);
    return { document: legacyThemeToDocument({ properties: {}, skin_content: null, template_kind: "classic" }), source: "legacy" };
  }
}

export function loadPublishedThemeDocument(tenantSlug: string) {
  return unstable_cache(
    () => readPublishedThemeDocument(tenantSlug),
    ["theme-document-published", tenantSlug],
    { tags: [siteThemeActiveCacheTagForTenant(tenantSlug)], revalidate: 300 },
  )();
}

export async function attachPublishedDocument(
  snapshot: ActiveThemeSnapshot | null,
  slug: string | null,
): Promise<ActiveThemeSnapshot | null> {
  if (!snapshot || !slug) return snapshot;
  try {
    return { ...snapshot, publishedDocument: await loadPublishedThemeDocument(slug) };
  } catch (err) {
    await logServerException("themeDocument.read", err);
    return snapshot;
  }
}
