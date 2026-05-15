import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import type { LandingMediaAcceptedMime } from "@/lib/cms/siteThemeLandingInputSchemas";
import { buildThemeBrandAssetStoragePath } from "@/lib/cms/siteThemeBrandStoragePath";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  assertSiteSetupFileSize,
  decodeSiteSetupFileBase64,
} from "@/lib/site/siteSetupCompletionSchema";
import { uploadFaviconZipBundleToStorage } from "@/lib/site/uploadFaviconZipBundleToStorage";

export type SiteSetupAssetUploadError =
  | "payload_invalid"
  | "favicon_zip_invalid"
  | "persist_failed";

export interface SiteSetupLogoUpload {
  path: string;
}

export async function uploadSiteSetupLogo(
  supabase: SupabaseClient,
  themeId: string,
  contentType: string,
  base64: string,
): Promise<
  { ok: true; logo: SiteSetupLogoUpload } | { ok: false; code: SiteSetupAssetUploadError }
> {
  const mime = contentType as LandingMediaAcceptedMime;
  const bytes = decodeSiteSetupFileBase64(base64);
  if (!bytes || !assertSiteSetupFileSize(bytes)) {
    return { ok: false, code: "payload_invalid" };
  }
  const path = buildThemeBrandAssetStoragePath(themeId, "logo", mime);
  const { error } = await supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    logSupabaseError("siteSetup:uploadLogo", error);
    return { ok: false, code: "persist_failed" };
  }
  return { ok: true, logo: { path } };
}

export interface SiteSetupFaviconUpload {
  /** Path that becomes `app.favicon.path`. */
  favPath: string;
  /** Every storage path uploaded (used for rollback on later failure). */
  uploadedPaths: string[];
  /** When the ZIP branch ran, the bundle prefix to persist alongside. */
  bundlePrefix?: string;
}

export async function uploadSiteSetupSingleFavicon(
  supabase: SupabaseClient,
  themeId: string,
  contentType: string,
  base64: string,
): Promise<
  | { ok: true; favicon: SiteSetupFaviconUpload }
  | { ok: false; code: SiteSetupAssetUploadError }
> {
  const mime = contentType as LandingMediaAcceptedMime;
  const bytes = decodeSiteSetupFileBase64(base64);
  if (!bytes || !assertSiteSetupFileSize(bytes)) {
    return { ok: false, code: "payload_invalid" };
  }
  const path = buildThemeBrandAssetStoragePath(themeId, "favicon", mime);
  const { error } = await supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    logSupabaseError("siteSetup:uploadFavicon", error);
    return { ok: false, code: "persist_failed" };
  }
  return {
    ok: true,
    favicon: { favPath: path, uploadedPaths: [path] },
  };
}

export async function uploadSiteSetupFaviconBundle(
  supabase: SupabaseClient,
  themeId: string,
  base64: string,
): Promise<
  | { ok: true; favicon: SiteSetupFaviconUpload }
  | { ok: false; code: SiteSetupAssetUploadError }
> {
  const zipBytes = decodeSiteSetupFileBase64(base64);
  if (!zipBytes || !assertSiteSetupFileSize(zipBytes)) {
    return { ok: false, code: "payload_invalid" };
  }
  const zipUp = await uploadFaviconZipBundleToStorage(
    supabase,
    themeId,
    zipBytes,
  );
  if (!zipUp.ok) {
    return zipUp.kind === "parse"
      ? { ok: false, code: "favicon_zip_invalid" }
      : { ok: false, code: "persist_failed" };
  }
  return {
    ok: true,
    favicon: {
      favPath: zipUp.favPath,
      uploadedPaths: zipUp.uploadedPaths,
      bundlePrefix: zipUp.bundlePrefix,
    },
  };
}

export async function rollbackSiteSetupUploads(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(LANDING_MEDIA_BUCKET).remove(paths);
}
