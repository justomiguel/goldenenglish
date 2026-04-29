import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrc } from "@/lib/cms/resolveLandingMedia";

/**
 * Certification section logos (landing). Slots match `scripts/migrate-public-assets.mjs`:
 * - `1` — UTN / inglés (legacy screenshot `…1.31.36…`)
 * - `2` — marca Golden (legacy `…1.31.42…`)
 * - `3` — Cambridge (legacy `…1.31.48…`)
 *
 * Bundled fallback filenames are `public/images/sections/certificaciones/{1..3}.png`
 * when present; after Storage migration, overrides come from `site_theme_media`.
 */
export function certificacionesSlotSrc(
  slot: 1 | 2 | 3,
  media?: LandingMediaMap,
): string {
  return resolveLandingImageSrc("certificaciones", `${slot}.png`, media);
}
