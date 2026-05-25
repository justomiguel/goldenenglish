import type { SupabaseClient } from "@supabase/supabase-js";
import { isAcceptedLandingMediaMime } from "@/lib/cms/siteThemeLandingInputSchemas";
import type { CompleteInitialSiteSetupInput } from "@/lib/site/siteSetupCompletionSchema";
import {
  rollbackSiteSetupUploads,
  uploadSiteSetupFaviconBundle,
  uploadSiteSetupLogo,
  uploadSiteSetupSingleFavicon,
  type SiteSetupAssetUploadError,
} from "@/lib/site/uploadSiteSetupAssets";

export type SiteSetupWizardAssetsResult =
  | {
      ok: true;
      logoPath: string | null;
      favPath: string | null;
      favUploadedPaths: string[];
      faviconBundlePrefixStored?: string;
      clearFaviconBundlePrefix: boolean;
    }
  | {
      ok: false;
      code: SiteSetupAssetUploadError | "mime_invalid" | "invalid_input";
    };

export async function uploadInitialSiteSetupWizardAssets(
  supabase: SupabaseClient,
  data: CompleteInitialSiteSetupInput,
  mode: "create" | "edit",
): Promise<SiteSetupWizardAssetsResult> {
  if (data.logoContentType && !isAcceptedLandingMediaMime(data.logoContentType)) {
    return { ok: false, code: "mime_invalid" };
  }
  if (
    data.faviconKind === "single" &&
    data.faviconContentType &&
    !isAcceptedLandingMediaMime(data.faviconContentType)
  ) {
    return { ok: false, code: "mime_invalid" };
  }

  let logoPath: string | null = null;
  if (data.logoContentType && data.logoBase64) {
    const up = await uploadSiteSetupLogo(
      supabase,
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
      supabase,
      data.themeId,
      data.faviconContentType,
      data.faviconBase64,
    );
    if (!up.ok) {
      await rollbackSiteSetupUploads(supabase, logoPath ? [logoPath] : []);
      return { ok: false, code: up.code };
    }
    favPath = up.favicon.favPath;
    favUploadedPaths.push(...up.favicon.uploadedPaths);
    clearFaviconBundlePrefix = true;
  } else if (data.faviconKind === "zip" && data.faviconZipBase64) {
    const up = await uploadSiteSetupFaviconBundle(
      supabase,
      data.themeId,
      data.faviconZipBase64,
    );
    if (!up.ok) {
      await rollbackSiteSetupUploads(supabase, logoPath ? [logoPath] : []);
      return { ok: false, code: up.code };
    }
    favPath = up.favicon.favPath;
    favUploadedPaths.push(...up.favicon.uploadedPaths);
    faviconBundlePrefixStored = up.favicon.bundlePrefix;
  } else if (mode === "create") {
    return { ok: false, code: "invalid_input" };
  }

  return {
    ok: true,
    logoPath,
    favPath,
    favUploadedPaths,
    faviconBundlePrefixStored,
    clearFaviconBundlePrefix,
  };
}

export async function rollbackSiteSetupWizardAssets(
  supabase: SupabaseClient,
  logoPath: string | null,
  favUploadedPaths: string[],
): Promise<void> {
  await rollbackSiteSetupUploads(supabase, [
    ...(logoPath ? [logoPath] : []),
    ...favUploadedPaths,
  ]);
}
