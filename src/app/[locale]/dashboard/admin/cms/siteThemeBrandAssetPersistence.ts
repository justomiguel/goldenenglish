import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import { loadProperties } from "@/lib/theme/themeParser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminContext } from "./siteThemeActionShared";
import type { SiteThemeActionResult } from "./siteThemeActionShared";
import { revalidateSiteThemeSurfaces } from "./siteThemeActionShared";

export function isThemeOwnedStoragePath(themeId: string, path: string): boolean {
  const t = path.trim();
  return t.length > 0 && t.startsWith(`${themeId}/`) && !t.includes("..");
}

export async function removeThemeStorageObjects(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  await supabase.storage.from(LANDING_MEDIA_BUCKET).remove(unique);
}

export async function persistSiteThemePropertyPatch(
  admin: AdminContext,
  themeId: string,
  locale: string,
  baseProperties: unknown,
  patch: Record<string, string>,
  removeKeys: string[],
): Promise<SiteThemeActionResult> {
  const baseFlat = parseSiteThemePropertyStrings(baseProperties);
  const merged = { ...baseFlat, ...patch };
  for (const k of removeKeys) {
    delete merged[k];
  }
  const defaults = loadProperties();
  const cleaned = cleanThemeOverridesForPersistence(defaults, merged);

  const { error } = await admin.supabase
    .from("site_themes")
    .update({
      properties: cleaned,
      updated_by: admin.user.id,
    })
    .eq("id", themeId);

  if (error) {
    logSupabaseError("siteThemeBrandAsset:persist", error);
    return { ok: false, code: "persist_failed" };
  }

  revalidateSiteThemeSurfaces(locale);
  return {
    ok: true,
    id: themeId,
    applied: patch,
    cleared: removeKeys,
  };
}
