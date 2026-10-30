"use server";

import { z } from "zod";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import { getAlsTenant } from "@/lib/tenant/tenantAls";
import { publishGenericInstituteUpload } from "@/lib/tenant/publishInstitutePublicImages";
import { loadProperties } from "@/lib/theme/themeParser";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

const schema = z.object({
  id: z.string().uuid(),
  locale: z.string().min(2).max(5),
  patch: z.record(z.string(), z.string()),
  republishLetter: z.boolean().optional(),
});

export async function mergeSiteThemePropertiesAction(raw: unknown): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const existing = await fetchSiteThemeById(ctx.admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const next = { ...parseSiteThemePropertyStrings(existing.properties) };
  for (const [key, value] of Object.entries(parsed.data.patch)) {
    const trimmed = value.trim();
    if (!trimmed) delete next[key];
    else next[key] = trimmed;
  }
  const cleaned = cleanThemeOverridesForPersistence(loadProperties(), next);
  const letter = parsed.data.republishLetter === true || cleaned["app.favicon.mode"] === "letter";
  const slug = getAlsTenant()?.slug ?? null;

  if (letter && slug) {
    await publishGenericInstituteUpload({
      slug,
      theme: { ...existing, properties: cleaned },
      supabase: ctx.admin.supabase,
      locale: parsed.data.locale,
      replaceFaviconPath: true,
      persist: true,
    });
    revalidateSiteThemeSurfaces(parsed.data.locale);
    return { ok: true, id: parsed.data.id };
  }

  const { error } = await ctx.admin.supabase
    .from("site_themes")
    .update({ properties: cleaned, updated_by: ctx.admin.user.id })
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseError("mergeSiteThemeProperties", error, { themeId: parsed.data.id });
    return { ok: false, code: "persist_failed" };
  }
  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
