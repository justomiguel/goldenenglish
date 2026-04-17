"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  createSiteThemeInputSchema,
  duplicateSiteThemeInputSchema,
  renameSiteThemeInputSchema,
} from "@/lib/cms/siteThemeInputSchemas";
import { normalizeThemeSlug } from "@/lib/cms/normalizeThemeSlug";
import {
  PG_UNIQUE_VIOLATION,
  type SiteThemeActionResult,
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
} from "./siteThemeActionShared";

export async function createSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = createSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const slug = normalizeThemeSlug(parsed.data.slug);
  if (!slug) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  if (parsed.data.activate) {
    const { error: clearErr } = await admin.supabase
      .from("site_themes")
      .update({ is_active: false })
      .eq("is_active", true);
    if (clearErr) {
      logSupabaseError("siteThemeActions:create:clearActive", clearErr);
      return { ok: false, code: "persist_failed" };
    }
  }

  const { data, error } = await admin.supabase
    .from("site_themes")
    .insert({
      slug,
      name: parsed.data.name,
      is_active: parsed.data.activate,
      properties: {},
      content: {},
      updated_by: admin.user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (error?.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, code: "slug_taken" };
    }
    if (error) logSupabaseError("siteThemeActions:create:insert", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_created",
    resourceType: "site_theme",
    resourceId: data.id,
    payload: { slug, name: parsed.data.name, activated: parsed.data.activate },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: data.id };
}

export async function renameSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = renameSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ name: parsed.data.name, updated_by: admin.user.id })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseError("siteThemeActions:rename", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_renamed",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { name: parsed.data.name },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

export async function duplicateSiteThemeAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = duplicateSiteThemeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const slug = normalizeThemeSlug(parsed.data.slug);
  if (!slug) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const source = await fetchSiteThemeById(admin.supabase, parsed.data.sourceId);
  if (!source) return { ok: false, code: "not_found" };

  const { data, error } = await admin.supabase
    .from("site_themes")
    .insert({
      slug,
      name: parsed.data.name,
      is_active: false,
      properties: source.properties ?? {},
      content: source.content ?? {},
      updated_by: admin.user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (error?.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, code: "slug_taken" };
    }
    if (error) logSupabaseError("siteThemeActions:duplicate", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_duplicated",
    resourceType: "site_theme",
    resourceId: data.id,
    payload: { slug, name: parsed.data.name, source_id: parsed.data.sourceId },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: data.id };
}
