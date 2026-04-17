"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import {
  resetSiteThemePropertiesInputSchema,
  updateSiteThemePropertiesInputSchema,
} from "@/lib/cms/siteThemeInputSchemas";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

/**
 * Persists the design system editor changes for a single template.
 *
 * The action accepts the full overrides map sent from the editor, then sanitizes
 * it through `cleanThemeOverridesForPersistence` so:
 *   - keys outside the allow-list never reach the row,
 *   - values matching the default from `system.properties` are stripped (so the
 *     JSONB stays minimal and rebrands of the defaults still propagate),
 *   - the persisted shape is sorted (diff-friendly snapshots).
 *
 * Caching: when the edited template is currently active, the cached snapshot
 * used by the public layout is invalidated via `revalidateSiteThemeSurfaces`,
 * so visitors see the new tokens within the next request without a redeploy.
 */
export async function updateSiteThemePropertiesAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = updateSiteThemePropertiesInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const defaults = loadProperties();
  const cleaned = cleanThemeOverridesForPersistence(
    defaults,
    parsed.data.overrides,
  );

  const { error } = await admin.supabase
    .from("site_themes")
    .update({
      properties: cleaned,
      updated_by: admin.user.id,
    })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeActions:updateProperties", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_properties_updated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: {
      overrides_count: Object.keys(cleaned).length,
      keys: Object.keys(cleaned),
    },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

/**
 * Wipes all overrides on a template, restoring the design tokens to the
 * defaults from `system.properties`. Useful when admins want a quick "reset"
 * before iterating again.
 */
export async function resetSiteThemePropertiesAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = resetSiteThemePropertiesInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ properties: {}, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeActions:resetProperties", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_properties_reset",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
