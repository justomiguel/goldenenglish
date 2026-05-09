"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import {
  isAcceptedLandingMediaMime,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import { coerceInitialSiteSetupSocialFields } from "@/lib/site/coerceSiteSetupSocialUrl";
import {
  assertSiteSetupFileSize,
  completeInitialSiteSetupInputSchema,
  decodeSiteSetupFileBase64,
} from "@/lib/site/siteSetupCompletionSchema";
import { uploadFaviconZipBundleToStorage } from "@/lib/site/uploadFaviconZipBundleToStorage";
import { buildThemeBrandAssetStoragePath } from "@/lib/cms/siteThemeBrandStoragePath";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import { getSiteBrandThemeSlug } from "@/lib/theme/siteBrandThemeSlug";
import { isThemeEligibleForInitialSiteSetup } from "@/lib/site/wizardThemeEligibility";

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
        | "mime_invalid"
        | "favicon_zip_invalid";
    };

export async function completeInitialSiteSetupAction(
  raw: unknown,
): Promise<CompleteInitialSiteSetupResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: "forbidden" };

  const coercedSocial = coerceInitialSiteSetupSocialFields(raw);
  if (!coercedSocial.ok) return { ok: false, code: coercedSocial.code };

  const parsed = completeInitialSiteSetupInputSchema.safeParse(coercedSocial.value);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const data = parsed.data;
  if (!isAcceptedLandingMediaMime(data.logoContentType)) {
    return { ok: false, code: "mime_invalid" };
  }

  if (
    data.faviconKind === "single" &&
    !isAcceptedLandingMediaMime(data.faviconContentType)
  ) {
    return { ok: false, code: "mime_invalid" };
  }

  const logoMime = data.logoContentType as LandingMediaAcceptedMime;

  const logoBytes = decodeSiteSetupFileBase64(data.logoBase64);
  if (!logoBytes || !assertSiteSetupFileSize(logoBytes)) {
    return { ok: false, code: "payload_invalid" };
  }

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, data.themeId);
  if (
    !isThemeEligibleForInitialSiteSetup(
      existing
        ? {
            is_active: existing.is_active,
            slug: existing.slug,
            archived_at: existing.archived_at,
          }
        : null,
      getSiteBrandThemeSlug(),
    )
  ) {
    return { ok: false, code: "not_found" };
  }
  if (!existing) return { ok: false, code: "not_found" };

  const logoPath = buildThemeBrandAssetStoragePath(data.themeId, "logo", logoMime);

  const { error: logoErr } = await admin.supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(logoPath, logoBytes, { contentType: logoMime, upsert: false });
  if (logoErr) {
    logSupabaseError("siteSetup:uploadLogo", logoErr);
    return { ok: false, code: "persist_failed" };
  }

  let favPath: string;
  const favUploadedPaths: string[] = [];
  let faviconBundlePrefixStored: string | undefined;

  if (data.faviconKind === "single") {
    const favMime = data.faviconContentType as LandingMediaAcceptedMime;
    const favBytes = decodeSiteSetupFileBase64(data.faviconBase64);
    if (!favBytes || !assertSiteSetupFileSize(favBytes)) {
      await admin.supabase.storage.from(LANDING_MEDIA_BUCKET).remove([logoPath]);
      return { ok: false, code: "payload_invalid" };
    }

    favPath = buildThemeBrandAssetStoragePath(data.themeId, "favicon", favMime);
    favUploadedPaths.push(favPath);

    const { error: favErr } = await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .upload(favPath, favBytes, { contentType: favMime, upsert: false });
    if (favErr) {
      logSupabaseError("siteSetup:uploadFavicon", favErr);
      await admin.supabase.storage.from(LANDING_MEDIA_BUCKET).remove([logoPath]);
      return { ok: false, code: "persist_failed" };
    }
  } else {
    const zipBytes = decodeSiteSetupFileBase64(data.faviconZipBase64);
    if (!zipBytes || !assertSiteSetupFileSize(zipBytes)) {
      await admin.supabase.storage.from(LANDING_MEDIA_BUCKET).remove([logoPath]);
      return { ok: false, code: "payload_invalid" };
    }

    const zipUp = await uploadFaviconZipBundleToStorage(
      admin.supabase,
      data.themeId,
      zipBytes,
    );
    if (!zipUp.ok) {
      await admin.supabase.storage.from(LANDING_MEDIA_BUCKET).remove([logoPath]);
      return zipUp.kind === "parse"
        ? { ok: false, code: "favicon_zip_invalid" }
        : { ok: false, code: "persist_failed" };
    }

    favPath = zipUp.favPath;
    favUploadedPaths.push(...zipUp.uploadedPaths);
    faviconBundlePrefixStored = zipUp.bundlePrefix;
  }

  const existingFlat = parseSiteThemePropertyStrings(existing.properties);
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

  if (faviconBundlePrefixStored) {
    wizardFlat["app.favicon.bundle.prefix"] = faviconBundlePrefixStored;
  }

  const tagEn = data.taglineEn?.trim();
  if (tagEn) wizardFlat["app.tagline.en"] = tagEn;
  if (data.socialFacebook) wizardFlat["social.facebook"] = data.socialFacebook;
  if (data.socialInstagram)
    wizardFlat["social.instagram"] = data.socialInstagram;
  if (data.socialWhatsapp) wizardFlat["social.whatsapp"] = data.socialWhatsapp;

  const defaults = loadProperties();
  const mergedRaw = { ...existingFlat, ...wizardFlat };
  if (data.faviconKind === "single") {
    delete mergedRaw["app.favicon.bundle.prefix"];
  }

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
      .remove([logoPath, ...favUploadedPaths]);
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
    await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .remove([logoPath, ...favUploadedPaths]);
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
