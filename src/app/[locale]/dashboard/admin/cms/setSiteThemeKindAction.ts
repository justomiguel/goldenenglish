"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { setSiteThemeKindInputSchema } from "@/lib/cms/siteThemeBlocksInputSchemas";
import { carryGenericLandingContent } from "@/lib/landing/carryGenericLandingContent";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { SiteThemeContent } from "@/types/theming";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

export async function setSiteThemeKindAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = setSiteThemeKindInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const fromKind = typeof existing.template_kind === "string" ? existing.template_kind : null;
  const toKind = parsed.data.kind;
  const carried =
    isGenericInstituteKind(fromKind) && isGenericInstituteKind(toKind)
      ? carryGenericLandingContent(
          (existing.content as SiteThemeContent | null) ?? null,
          fromKind,
          toKind,
          {
            es: await getDictionary("es"),
            en: await getDictionary("en"),
            pt: await getDictionary("pt"),
          },
        )
      : null;

  const { error } = await admin.supabase
    .from("site_themes")
    .update({
      template_kind: toKind,
      updated_by: admin.user.id,
      ...(carried ? { content: carried } : {}),
    })
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseError("siteThemeBlocksActions:setKind", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_kind_updated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { kind: toKind },
  });
  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
