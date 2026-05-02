import {
  LANDING_COPY_KEYS_BY_SECTION,
  LANDING_MEDIA_SLOTS_BY_SECTION,
} from "@/lib/cms/landingContentCatalog";
import {
  MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION,
  MOZARTHITOS_MEDIA_SLOTS_BY_SECTION,
} from "@/lib/cms/landingMozarthitosCatalog";
import type { LandingSectionSlug, SiteThemeKind } from "@/types/theming";

export function landingCopyKeysForTheme(
  kind: SiteThemeKind,
  section: LandingSectionSlug,
): ReadonlyArray<string> {
  if (kind === "mozarthitos") {
    return MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION[section];
  }
  return LANDING_COPY_KEYS_BY_SECTION[section];
}

export function landingMediaSlotsForTheme(
  kind: SiteThemeKind,
  section: LandingSectionSlug,
): number {
  if (kind === "mozarthitos") {
    return MOZARTHITOS_MEDIA_SLOTS_BY_SECTION[section];
  }
  return LANDING_MEDIA_SLOTS_BY_SECTION[section];
}
