import {
  landingMediaExtensionForMime,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";

/** Paths under `landing-media` for logo/favicon uploaded from admin (wizard or CMS). */
export function buildThemeBrandAssetStoragePath(
  themeId: string,
  role: "logo" | "favicon",
  mime: LandingMediaAcceptedMime,
): string {
  const ext = landingMediaExtensionForMime(mime);
  const stamp = Date.now().toString(36);
  return `${themeId}/wizard/${role}-${stamp}.${ext}`;
}
