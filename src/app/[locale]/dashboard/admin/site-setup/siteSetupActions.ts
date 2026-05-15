"use server";

import { updateTag } from "next/cache";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { isAcceptedLandingMediaMime } from "@/lib/cms/siteThemeLandingInputSchemas";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { loadProperties } from "@/lib/theme/themeParser";
import { coerceInitialSiteSetupSocialFields } from "@/lib/site/coerceSiteSetupSocialUrl";
import { completeInitialSiteSetupInputSchema } from "@/lib/site/siteSetupCompletionSchema";
import { buildSiteSetupOverrideMap } from "@/lib/site/buildSiteSetupOverrideMap";
import {
  buildSiteSetupOperationalRows,
  persistSiteSetupOperationalSettings,
} from "@/lib/site/persistSiteSetupOperationalSettings";
import {
  rollbackSiteSetupUploads,
  uploadSiteSetupFaviconBundle,
  uploadSiteSetupLogo,
  uploadSiteSetupSingleFavicon,
} from "@/lib/site/uploadSiteSetupAssets";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import { getSiteBrandThemeSlug } from "@/lib/theme/siteBrandThemeSlug";
import { isThemeEligibleForInitialSiteSetup } from "@/lib/site/wizardThemeEligibility";
import { SITE_SETTINGS_OPERATIONAL_CACHE_TAG } from "@/lib/site/siteSettingsOperationalTag";

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

  const parsed = completeInitialSiteSetupInputSchema.safeParse(
    coercedSocial.value,
  );
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const data = parsed.data;
  const mode = data.mode ?? "create";

  if (
    data.logoContentType &&
    !isAcceptedLandingMediaMime(data.logoContentType)
  ) {
    return { ok: false, code: "mime_invalid" };
  }
  if (
    data.faviconKind === "single" &&
    data.faviconContentType &&
    !isAcceptedLandingMediaMime(data.faviconContentType)
  ) {
    return { ok: false, code: "mime_invalid" };
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

  // ------- upload assets when provided -------
  let logoPath: string | null = null;
  if (data.logoContentType && data.logoBase64) {
    const up = await uploadSiteSetupLogo(
      admin.supabase,
      data.themeId,
      data.logoContentType,
      data.logoBase64,
    );
    if (!up.ok) return { ok: false, code: up.code };
    logoPath = up.logo.path;
  } else if (mode === "create") {
    return { ok: false, code: "invalid_input" };
  }

  let favPath: string | null = null;
  const favUploadedPaths: string[] = [];
  let faviconBundlePrefixStored: string | undefined;
  let clearFaviconBundlePrefix = false;

  if (
    data.faviconKind === "single" &&
    data.faviconBase64 &&
    data.faviconContentType
  ) {
    const up = await uploadSiteSetupSingleFavicon(
      admin.supabase,
      data.themeId,
      data.faviconContentType,
      data.faviconBase64,
    );
    if (!up.ok) {
      await rollbackSiteSetupUploads(
        admin.supabase,
        logoPath ? [logoPath] : [],
      );
      return { ok: false, code: up.code };
    }
    favPath = up.favicon.favPath;
    favUploadedPaths.push(...up.favicon.uploadedPaths);
    clearFaviconBundlePrefix = true;
  } else if (data.faviconKind === "zip" && data.faviconZipBase64) {
    const up = await uploadSiteSetupFaviconBundle(
      admin.supabase,
      data.themeId,
      data.faviconZipBase64,
    );
    if (!up.ok) {
      await rollbackSiteSetupUploads(
        admin.supabase,
        logoPath ? [logoPath] : [],
      );
      return { ok: false, code: up.code };
    }
    favPath = up.favicon.favPath;
    favUploadedPaths.push(...up.favicon.uploadedPaths);
    faviconBundlePrefixStored = up.favicon.bundlePrefix;
  } else if (mode === "create") {
    return { ok: false, code: "invalid_input" };
  }

  // ------- build override map + persist -------
  const existingFlat = parseSiteThemePropertyStrings(existing.properties);
  const wizardFlat = buildSiteSetupOverrideMap({
    data,
    logoPath,
    favPath,
    faviconBundlePrefix: faviconBundlePrefixStored,
    clearFaviconBundlePrefix,
  });

  const mergedRaw = { ...existingFlat, ...wizardFlat };
  if (clearFaviconBundlePrefix) delete mergedRaw["app.favicon.bundle.prefix"];

  const cleaned = cleanThemeOverridesForPersistence(loadProperties(), mergedRaw);

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
    await rollbackSiteSetupUploads(admin.supabase, [
      ...(logoPath ? [logoPath] : []),
      ...favUploadedPaths,
    ]);
    return { ok: false, code: "persist_failed" };
  }

  // ------- persist operational rows (legal / billing / academics / analytics) -------
  const operationalRows = buildSiteSetupOperationalRows(data);
  if (operationalRows.length > 0) {
    const opRes = await persistSiteSetupOperationalSettings(
      admin.supabase,
      operationalRows,
    );
    if (!opRes.ok) {
      await rollbackSiteSetupUploads(admin.supabase, [
        ...(logoPath ? [logoPath] : []),
        ...favUploadedPaths,
      ]);
      return { ok: false, code: "persist_failed" };
    }
  }

  if (mode === "create") {
    const { error: settingsErr } = await admin.supabase
      .from("site_settings")
      .upsert(
        {
          key: "initial_site_setup",
          value: { completedAt: new Date().toISOString(), version: 1 },
        },
        { onConflict: "key" },
      );

    if (settingsErr) {
      logSupabaseError("siteSetup:siteSettings", settingsErr);
      await rollbackSiteSetupUploads(admin.supabase, [
        ...(logoPath ? [logoPath] : []),
        ...favUploadedPaths,
      ]);
      return { ok: false, code: "persist_failed" };
    }
  }

  // ------- audit + analytics -------
  void recordSystemAudit({
    action:
      mode === "create"
        ? "initial_site_setup_completed"
        : "site_setup_reedited",
    resourceType: "site_settings",
    resourceId: "initial_site_setup",
    payload: { theme_id: data.themeId, mode },
  });
  void recordUserEventServer({
    userId: admin.user.id,
    eventType: "action",
    entity: AnalyticsEntity.initialSiteSetup,
    metadata: { theme_id: data.themeId, mode },
  });

  revalidateSiteThemeSurfaces(data.locale);
  updateTag(SITE_SETTINGS_OPERATIONAL_CACHE_TAG);
  return { ok: true };
}
