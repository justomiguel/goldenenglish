"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import {
  isAcceptedLandingMediaMime,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import {
  uploadSiteThemeFaviconFromEditorSchema,
  uploadSiteThemeLogoFromEditorSchema,
} from "@/lib/cms/siteThemeBrandAssetSchemas";
import { buildThemeBrandAssetStoragePath } from "@/lib/cms/siteThemeBrandStoragePath";
import {
  assertSiteSetupFileSize,
  decodeSiteSetupFileBase64,
} from "@/lib/site/siteSetupCompletionSchema";
import { uploadFaviconZipBundleToStorage } from "@/lib/site/uploadFaviconZipBundleToStorage";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { publishGenericInstituteUpload } from "@/lib/tenant/publishInstitutePublicImages";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";
import {
  isThemeOwnedStoragePath,
  persistSiteThemePropertyPatch,
  removeThemeStorageObjects,
} from "./siteThemeBrandAssetPersistence";

export async function uploadSiteThemeLogoFromEditorAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = uploadSiteThemeLogoFromEditorSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const mime = parsed.data.contentType as LandingMediaAcceptedMime;
  const bytes = decodeSiteSetupFileBase64(parsed.data.fileBase64);
  if (!bytes) return { ok: false, code: "payload_invalid" };
  if (!assertSiteSetupFileSize(bytes)) {
    return { ok: false, code: "media_too_large" };
  }

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const baseFlat = parseSiteThemePropertyStrings(existing.properties);
  const oldLogo = baseFlat["app.logo.path"] ?? "";
  const storagePath = buildThemeBrandAssetStoragePath(
    parsed.data.id,
    "logo",
    mime,
  );

  const { error: upErr } = await admin.supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(storagePath, bytes, { contentType: mime, upsert: false });
  if (upErr) {
    logSupabaseError("siteThemeBrandAsset:logoUpload", upErr);
    return { ok: false, code: "persist_failed" };
  }

  const tenant = await resolveRequestTenant();
  const published = await publishGenericInstituteUpload({
    slug: tenant?.slug,
    theme: existing,
    supabase: admin.supabase,
    locale: parsed.data.locale,
    replaceFaviconPath: false,
    logo: { bytes, contentType: mime },
  });
  const patch: Record<string, string> = {
    "app.logo.path": published?.logoPath ?? storagePath,
  };
  if (published?.sharePath) patch["app.share.image"] = published.sharePath;
  const alt = parsed.data.logoAlt?.trim();
  if (alt) patch["app.logo.alt"] = alt;

  const persisted = await persistSiteThemePropertyPatch(
    admin,
    parsed.data.id,
    parsed.data.locale,
    existing.properties,
    patch,
    [],
  );

  if (!persisted.ok) {
    await removeThemeStorageObjects(admin.supabase, [storagePath]);
    return persisted;
  }

  if (isThemeOwnedStoragePath(parsed.data.id, oldLogo)) {
    await removeThemeStorageObjects(admin.supabase, [oldLogo]);
  }

  void recordSystemAudit({
    action: "site_theme_logo_uploaded",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { bytes: bytes.byteLength, mime },
  });

  return { ok: true, id: parsed.data.id, applied: patch, cleared: [] };
}

export async function uploadSiteThemeFaviconFromEditorAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = uploadSiteThemeFaviconFromEditorSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const baseFlat = parseSiteThemePropertyStrings(existing.properties);
  const oldFav = baseFlat["app.favicon.path"] ?? "";
  let uploadedPaths: string[] = [];
  let favPath: string;
  let bundlePrefix: string | undefined;
  let singleFav: { bytes: Uint8Array; contentType: string } | null = null;

  if (parsed.data.faviconKind === "zip") {
    const zipBytes = decodeSiteSetupFileBase64(parsed.data.faviconZipBase64);
    if (!zipBytes) return { ok: false, code: "payload_invalid" };
    if (!assertSiteSetupFileSize(zipBytes)) {
      return { ok: false, code: "media_too_large" };
    }
    const zipUp = await uploadFaviconZipBundleToStorage(
      admin.supabase,
      parsed.data.id,
      zipBytes,
    );
    if (!zipUp.ok) {
      return zipUp.kind === "parse"
        ? { ok: false, code: "favicon_zip_invalid" }
        : { ok: false, code: "persist_failed" };
    }
    favPath = zipUp.favPath;
    uploadedPaths = zipUp.uploadedPaths;
    bundlePrefix = zipUp.bundlePrefix;
  } else {
    const favMime = parsed.data.faviconContentType as LandingMediaAcceptedMime;
    if (!isAcceptedLandingMediaMime(parsed.data.faviconContentType)) {
      return { ok: false, code: "mime_invalid" };
    }
    const favBytes = decodeSiteSetupFileBase64(parsed.data.faviconBase64);
    if (!favBytes) return { ok: false, code: "payload_invalid" };
    if (!assertSiteSetupFileSize(favBytes)) {
      return { ok: false, code: "media_too_large" };
    }
    const path = buildThemeBrandAssetStoragePath(
      parsed.data.id,
      "favicon",
      favMime,
    );
    const { error: favErr } = await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .upload(path, favBytes, { contentType: favMime, upsert: false });
    if (favErr) {
      logSupabaseError("siteThemeBrandAsset:faviconUpload", favErr);
      return { ok: false, code: "persist_failed" };
    }
    favPath = path;
    uploadedPaths = [path];
    singleFav = { bytes: favBytes, contentType: favMime };
  }

  const tenant = await resolveRequestTenant();
  const published = singleFav
    ? await publishGenericInstituteUpload({
        slug: tenant?.slug,
        theme: existing,
        supabase: admin.supabase,
        locale: parsed.data.locale,
        replaceFaviconPath: true,
        favicon: singleFav,
      })
    : null;
  const patch: Record<string, string> = {
    "app.favicon.path": published?.faviconPath ?? favPath,
  };
  if (published?.sharePath) patch["app.share.image"] = published.sharePath;
  const removeKeys =
    parsed.data.faviconKind === "zip"
      ? []
      : (["app.favicon.bundle.prefix"] as const);
  if (parsed.data.faviconKind === "zip" && bundlePrefix) {
    patch["app.favicon.bundle.prefix"] = bundlePrefix;
  }

  const persisted = await persistSiteThemePropertyPatch(
    admin,
    parsed.data.id,
    parsed.data.locale,
    existing.properties,
    patch,
    [...removeKeys],
  );

  if (!persisted.ok) {
    await removeThemeStorageObjects(admin.supabase, uploadedPaths);
    return persisted;
  }

  if (isThemeOwnedStoragePath(parsed.data.id, oldFav)) {
    await removeThemeStorageObjects(admin.supabase, [oldFav]);
  }

  void recordSystemAudit({
    action: "site_theme_favicon_uploaded",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: {
      kind: parsed.data.faviconKind,
      bytes_total: uploadedPaths.length,
    },
  });

  return {
    ok: true,
    id: parsed.data.id,
    applied: patch,
    cleared: [...removeKeys],
  };
}
