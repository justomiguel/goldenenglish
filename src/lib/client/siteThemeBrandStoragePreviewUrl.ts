import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";

/** Browser-safe URL for a storage object in the landing-media bucket (same host `/geo/...` proxy). */
export function siteThemeBrandStoragePreviewUrl(path: string): string {
  const t = path.trim();
  if (!t) return "";
  if (t.startsWith("http")) return t;
  return `/geo/${LANDING_MEDIA_BUCKET}/${encodeURI(t)}`;
}
