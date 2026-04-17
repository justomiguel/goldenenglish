import type {
  LandingSectionSlug,
  SiteThemeMediaRow,
} from "@/types/theming";
import {
  sectionImageSrc,
  type LandingImageSectionSlug,
} from "@/lib/landing/sectionLandingImages";

/**
 * Pure helpers for landing media overrides.
 *
 * The runtime layer reads media rows from the active site theme and offers a
 * stable API back to the landing organisms: "give me the URL for image X of
 * section Y". When an admin uploaded a custom file we return its public URL;
 * otherwise we fall back to the bundled `/images/sections/<slug>/<file>` PNG.
 */

/** Map of `(section, position)` → public URL for the active theme's media. */
export type LandingMediaMap = ReadonlyMap<string, string>;

function makeKey(section: LandingSectionSlug, position: number): string {
  return `${section}::${position}`;
}

/**
 * Builds the runtime URL map from raw media rows.
 *
 * `publicUrlFor(storagePath)` is injected so the helper stays pure: server
 * code passes a builder that knows how to assemble `${SUPABASE_URL}/storage/
 * v1/object/public/landing-media/<path>` (or whatever the Storage layer
 * returns from `getPublicUrl`).
 */
export function buildLandingMediaMap(
  rows: ReadonlyArray<SiteThemeMediaRow>,
  publicUrlFor: (storagePath: string) => string | null,
): LandingMediaMap {
  const out = new Map<string, string>();
  for (const row of rows) {
    if (!Number.isFinite(row.position) || row.position < 1) continue;
    const url = publicUrlFor(row.storagePath);
    if (!url) continue;
    out.set(makeKey(row.section, row.position), url);
  }
  return out;
}

/** Convention: numeric prefix in the bundled filename (e.g. `1.png`) is the
 *  position used to match against `site_theme_media.position`. Returns `null`
 *  when the filename does not start with a positive integer. */
export function landingPositionFromFilename(filename: string): number | null {
  const match = /^([0-9]+)/u.exec(filename);
  if (!match) return null;
  const value = Number.parseInt(match[1]!, 10);
  return Number.isFinite(value) && value >= 1 ? value : null;
}

/**
 * Returns the URL to render for a given landing image. Honors a CMS override
 * when present, otherwise falls back to the bundled file under
 * `/public/images/sections/`.
 *
 * The legacy local path is preserved as the fallback so the landing keeps
 * working when no theme is active (default deploy).
 */
export function resolveLandingImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
  media?: LandingMediaMap,
): string {
  if (media && media.size > 0) {
    const position = landingPositionFromFilename(filename);
    if (position !== null) {
      const override = media.get(makeKey(section, position));
      if (override) return override;
    }
  }
  return sectionImageSrc(section, filename);
}
