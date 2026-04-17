"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  activateSiteThemeInputSchema,
  archiveSiteThemeInputSchema,
  restoreSiteThemeInputSchema,
} from "@/lib/cms/siteThemeInputSchemas";
import {
  type SiteThemeActionResult,
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
} from "./siteThemeActionShared";

export async function activateSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = activateSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };
  if (existing.is_active) return { ok: false, code: "already_active" };
  if (existing.archived_at) {
    return { ok: false, code: "archived_cannot_activate" };
  }

  const { error: clearErr } = await admin.supabase
    .from("site_themes")
    .update({ is_active: false })
    .eq("is_active", true);
  if (clearErr) {
    logSupabaseError("siteThemeStateActions:activate:clear", clearErr);
    return { ok: false, code: "persist_failed" };
  }

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ is_active: true, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeStateActions:activate:set", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_activated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { slug: existing.slug },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

export async function archiveSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = archiveSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };
  if (existing.is_active) return { ok: false, code: "active_cannot_archive" };
  if (existing.archived_at) return { ok: true, id: parsed.data.id };

  const { error } = await admin.supabase
    .from("site_themes")
    .update({
      archived_at: new Date().toISOString(),
      updated_by: admin.user.id,
    })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeStateActions:archive", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_archived",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { slug: existing.slug },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

export async function restoreSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = restoreSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };
  if (!existing.archived_at) return { ok: true, id: parsed.data.id };

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ archived_at: null, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeStateActions:restore", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_restored",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { slug: existing.slug },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
