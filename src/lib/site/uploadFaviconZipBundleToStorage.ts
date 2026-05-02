import type { SupabaseClient } from "@supabase/supabase-js";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { LANDING_MEDIA_MAX_BYTES } from "@/lib/cms/siteThemeLandingInputSchemas";
import { logServerException } from "@/lib/logging/serverActionLog";
import {
  faviconBundleFileContentType,
  parseFaviconBundleZip,
} from "@/lib/site/faviconBundleZip";

export type UploadFaviconZipBundleResult =
  | {
      ok: true;
      bundlePrefix: string;
      favPath: string;
      uploadedPaths: string[];
    }
  | { ok: false; kind: "parse" }
  | { ok: false; kind: "upload" };

/** Parses favicon.io-style ZIP and uploads every allowed entry under one Storage prefix. */
export async function uploadFaviconZipBundleToStorage(
  supabase: SupabaseClient,
  themeId: string,
  zipBytes: Uint8Array,
): Promise<UploadFaviconZipBundleResult> {
  const parsed = parseFaviconBundleZip(zipBytes, LANDING_MEDIA_MAX_BYTES);
  if (!parsed.ok) return { ok: false, kind: "parse" };

  const stamp = Date.now().toString(36);
  const bundlePrefix = `${themeId}/wizard/favicon-bundle-${stamp}`;
  const uploadedPaths: string[] = [];

  try {
    for (const [name, bytes] of parsed.files) {
      const objectPath = `${bundlePrefix}/${name}`;
      const { error } = await supabase.storage
        .from(LANDING_MEDIA_BUCKET)
        .upload(objectPath, bytes, {
          contentType: faviconBundleFileContentType(name),
          upsert: false,
        });
      if (error) throw error;
      uploadedPaths.push(objectPath);
    }
  } catch (err) {
    logServerException("uploadFaviconZipBundleToStorage", err);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(LANDING_MEDIA_BUCKET).remove(uploadedPaths);
    }
    return { ok: false, kind: "upload" };
  }

  return {
    ok: true,
    bundlePrefix,
    favPath: `${bundlePrefix}/favicon.ico`,
    uploadedPaths,
  };
}
