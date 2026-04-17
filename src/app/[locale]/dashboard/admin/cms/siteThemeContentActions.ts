"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cleanLandingContentForPersistence } from "@/lib/cms/cleanLandingContentForPersistence";
import {
  resetSiteThemeContentInputSchema,
  updateSiteThemeContentInputSchema,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import type { SiteThemeContent } from "@/types/theming";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

/**
 * Persists copy overrides for one landing section into the row's `content`
 * JSONB. The action merges the new section bag with whatever the other
 * sections already had so editors only ship what they touched.
 *
 * The full payload is sanitized through `cleanLandingContentForPersistence`
 * so unknown keys, blank values and locale-default matches never reach the
 * database — that keeps a future copy refactor of the bundled dictionaries
 * propagating to clients without manual cleanup.
 */
export async function updateSiteThemeContentAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = updateSiteThemeContentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const [es, en] = await Promise.all([getDictionary("es"), getDictionary("en")]);

  const cleanedSection = cleanLandingContentForPersistence(
    { es, en },
    { [parsed.data.section]: parsed.data.copy },
  );

  const previous = (existing.content as SiteThemeContent | null) ?? {};
  const next: Record<string, unknown> = { ...previous };
  if (cleanedSection[parsed.data.section]) {
    next[parsed.data.section] = cleanedSection[parsed.data.section];
  } else {
    delete next[parsed.data.section];
  }

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ content: next, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeActions:updateContent", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_content_updated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: {
      section: parsed.data.section,
      keys: Object.keys(cleanedSection[parsed.data.section] ?? {}),
    },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

/**
 * Wipes the copy overrides for either one section (when `section` is set) or
 * the entire `content` map (when omitted). Mirrors
 * `resetSiteThemePropertiesAction` so admins always have a quick "back to
 * dictionary defaults" affordance.
 */
export async function resetSiteThemeContentAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = resetSiteThemeContentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  let nextContent: Record<string, unknown> = {};
  if (parsed.data.section) {
    const previous = (existing.content as SiteThemeContent | null) ?? {};
    nextContent = { ...previous };
    delete nextContent[parsed.data.section];
  }

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ content: nextContent, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeActions:resetContent", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_content_reset",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { section: parsed.data.section ?? null },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
