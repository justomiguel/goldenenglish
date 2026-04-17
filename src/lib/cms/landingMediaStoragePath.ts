import type { LandingSectionSlug } from "@/types/theming";
import {
  landingMediaExtensionForMime,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";

/**
 * Pure helper: builds the canonical storage object path inside the
 * `landing-media` bucket for a given (theme, section, position) slot.
 *
 * The path includes a millisecond timestamp suffix so consecutive uploads
 * never collide and CDN cache busts naturally.
 */
export function buildLandingMediaStoragePath(args: {
  themeId: string;
  section: LandingSectionSlug;
  position: number;
  mime: LandingMediaAcceptedMime;
  now?: number;
}): string {
  const ext = landingMediaExtensionForMime(args.mime);
  const stamp = (args.now ?? Date.now()).toString(36);
  return `${args.themeId}/${args.section}/${args.position}-${stamp}.${ext}`;
}
