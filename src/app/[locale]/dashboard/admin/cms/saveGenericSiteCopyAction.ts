"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { cleanLandingContentForPersistence } from "@/lib/cms/cleanLandingContentForPersistence";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  allowedGenericCopyKeys,
  genericCopyKind,
} from "@/lib/landing/genericSiteCopyFields";
import type { LocalizedCopy, SiteThemeContent } from "@/types/theming";
import { LANDING_SECTION_SLUGS } from "@/types/theming";
import { genericLandingCopyKeys } from "@/lib/cms/genericLandingCopyKeys";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

const inputSchema = z.object({
  id: z.string().uuid(),
  locale: z.enum(["es", "en", "pt"]),
  fields: z.array(z.object({
    key: z.string().trim().min(1).max(160),
    value: z.string().max(2000),
  })).max(40),
});

export async function saveGenericSiteCopyAction(raw: unknown): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: "forbidden" };
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const existing = await fetchSiteThemeById(ctx.admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };
  const kind = genericCopyKind(String(existing.template_kind));
  if (!kind) return { ok: false, code: "invalid_input" };

  const allowed = allowedGenericCopyKeys(kind);
  const nextContent: SiteThemeContent = { ...((existing.content as SiteThemeContent | null) ?? {}) };
  let contentDraft = nextContent;
  for (const field of parsed.data.fields) {
    if (!allowed.has(field.key)) return { ok: false, code: "invalid_input" };
    const value = field.value.trim();
    if (field.key.startsWith("genericSectionLabels.") && !value) {
      return { ok: false, code: "invalid_input" };
    }
    const section = sectionFor(kind, field.key);
    const bag: Record<string, LocalizedCopy> = {
      ...(contentDraft[section] ?? {}),
      [field.key]: { es: value, en: value, pt: value },
    };
    contentDraft = { ...contentDraft, [section]: bag };
  }

  const [es, en, pt] = await Promise.all([
    getDictionary("es"),
    getDictionary("en"),
    getDictionary("pt"),
  ]);
  const content = cleanLandingContentForPersistence({ es, en, pt }, contentDraft, kind);
  const { error } = await ctx.admin.supabase
    .from("site_themes")
    .update({ content, updated_by: ctx.admin.user.id })
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseError("saveGenericSiteCopyAction", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_content_updated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { section: "generic", keys: parsed.data.fields.map((field) => field.key) },
  });
  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

function sectionFor(kind: NonNullable<ReturnType<typeof genericCopyKind>>, key: string) {
  for (const section of LANDING_SECTION_SLUGS) {
    if (genericLandingCopyKeys(kind, section).includes(key)) return section;
  }
  return "inicio" as const;
}
