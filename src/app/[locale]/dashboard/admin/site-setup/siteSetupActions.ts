"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaPublicUrl";
import {
  isAcceptedLandingMediaMime,
  landingMediaExtensionForMime,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import {
  assertSiteSetupFileSize,
  completeInitialSiteSetupInputSchema,
  decodeSiteSetupFileBase64,
} from "@/lib/site/siteSetupCompletionSchema";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";

export type CompleteInitialSiteSetupResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "forbidden"
        | "invalid_input"
        | "not_found"
        | "persist_failed"
        | "payload_invalid"
        | "mime_invalid";
    };

function buildWizardStoragePath(
  themeId: string,
  role: "logo" | "favicon",
  mime: LandingMediaAcceptedMime,
): string {
  const ext = landingMediaExtensionForMime(mime);
  const stamp = Date.now().toString(36);
  return `${themeId}/wizard/${role}-${stamp}.${ext}`;
}

function parseThemeProperties(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function completeInitialSiteSetupAction(
  raw: unknown,
): Promise<CompleteInitialSiteSetupResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: "forbidden" };

  const parsed = completeInitialSiteSetupInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const data = parsed.data;
  if (
    !isAcceptedLandingMediaMime(data.logoContentType) ||
    !isAcceptedLandingMediaMime(data.faviconContentType)
  ) {
    return { ok: false, code: "mime_invalid" };
  }

  const logoMime = data.logoContentType as LandingMediaAcceptedMime;
  const favMime = data.faviconContentType as LandingMediaAcceptedMime;

  const logoBytes = decodeSiteSetupFileBase64(data.logoBase64);
  const favBytes = decodeSiteSetupFileBase64(data.faviconBase64);
  if (
    !logoBytes ||
    !favBytes ||
    !assertSiteSetupFileSize(logoBytes) ||
    !assertSiteSetupFileSize(favBytes)
  ) {
    return { ok: false, code: "payload_invalid" };
  }

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, data.themeId);
  if (!existing || !existing.is_active) return { ok: false, code: "not_found" };

  const logoPath = buildWizardStoragePath(data.themeId, "logo", logoMime);
  const favPath = buildWizardStoragePath(data.themeId, "favicon", favMime);

  const { error: logoErr } = await admin.supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(logoPath, logoBytes, { contentType: logoMime, upsert: false });
  if (logoErr) {
    logSupabaseError("siteSetup:uploadLogo", logoErr);
    return { ok: false, code: "persist_failed" };
  }

  const { error: favErr } = await admin.supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(favPath, favBytes, { contentType: favMime, upsert: false });
  if (favErr) {
    logSupabaseError("siteSetup:uploadFavicon", favErr);
    await admin.supabase.storage.from(LANDING_MEDIA_BUCKET).remove([logoPath]);
    return { ok: false, code: "persist_failed" };
  }

  const existingFlat = parseThemeProperties(existing.properties);
  const wizardFlat: Record<string, string> = {
    "app.name": data.appName,
    "app.legal.name": data.legalName,
    "app.tagline": data.tagline,
    "app.logo.path": logoPath,
    "app.logo.alt": data.logoAlt,
    "app.favicon.path": favPath,
    "contact.email": data.contactEmail,
    "contact.phone": data.contactPhone,
    "contact.address": data.contactAddress,
  };
  const tagEn = data.taglineEn?.trim();
  if (tagEn) wizardFlat["app.tagline.en"] = tagEn;
  if (data.socialFacebook)
    wizardFlat["social.facebook"] = data.socialFacebook;
  if (data.socialInstagram)
    wizardFlat["social.instagram"] = data.socialInstagram;
  if (data.socialWhatsapp)
    wizardFlat["social.whatsapp"] = data.socialWhatsapp;

  const defaults = loadProperties();
  const mergedRaw = { ...existingFlat, ...wizardFlat };
  const cleaned = cleanThemeOverridesForPersistence(defaults, mergedRaw);

  const { error: themeErr } = await admin.supabase
    .from("site_themes")
    .update({
      name: data.appName,
      properties: cleaned,
      updated_by: admin.user.id,
    })
    .eq("id", data.themeId);

  if (themeErr) {
    logSupabaseError("siteSetup:updateTheme", themeErr);
    await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .remove([logoPath, favPath]);
    return { ok: false, code: "persist_failed" };
  }

  const completedPayload = {
    completedAt: new Date().toISOString(),
    version: 1,
  };

  const { error: settingsErr } = await admin.supabase
    .from("site_settings")
    .upsert(
      {
        key: "initial_site_setup",
        value: completedPayload,
      },
      { onConflict: "key" },
    );

  if (settingsErr) {
    logSupabaseError("siteSetup:siteSettings", settingsErr);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "initial_site_setup_completed",
    resourceType: "site_settings",
    resourceId: "initial_site_setup",
    payload: { theme_id: data.themeId },
  });

  void recordUserEventServer({
    userId: admin.user.id,
    eventType: "action",
    entity: AnalyticsEntity.initialSiteSetup,
    metadata: { theme_id: data.themeId },
  });

  revalidateSiteThemeSurfaces(data.locale);
  return { ok: true };
}
