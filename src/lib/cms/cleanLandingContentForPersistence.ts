import type { Dictionary } from "@/types/i18n";
import type {
  LandingSectionSlug,
  LocalizedCopy,
  SiteThemeContent,
  SiteThemeSectionContent,
} from "@/types/theming";
import { LANDING_SECTION_SLUGS } from "@/types/theming";
import {
  LANDING_COPY_KEYS_BY_SECTION,
  LANDING_OVERRIDE_LOCALES,
  type LandingOverrideLocale,
} from "@/lib/cms/landingContentCatalog";
import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";

/**
 * Sanitizes a raw editor payload before persisting it into
 * `site_themes.content`.
 *
 * Rules:
 *  1. Only accept sections in {@link LANDING_SECTION_SLUGS}.
 *  2. Only accept dotted paths declared in
 *     {@link LANDING_COPY_KEYS_BY_SECTION} for the given section.
 *  3. Only accept locale keys in {@link LANDING_OVERRIDE_LOCALES}.
 *  4. Trim values; drop empty/whitespace-only ones.
 *  5. Drop values equal to the locale's dictionary default — keeps the JSONB
 *     minimal so a future copy refactor still propagates.
 *  6. Sort keys alphabetically inside each section so DB diffs stay clean.
 *
 * The provided dictionaries are read-only; the result is a fresh object that
 * can be passed straight to Supabase.
 */
export function cleanLandingContentForPersistence(
  defaults: Readonly<Record<LandingOverrideLocale, Dictionary>>,
  raw: unknown,
): SiteThemeContent {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<LandingSectionSlug, SiteThemeSectionContent>> = {};
  const inputSections = raw as Record<string, unknown>;

  for (const section of LANDING_SECTION_SLUGS) {
    const editableKeys = LANDING_COPY_KEYS_BY_SECTION[section];
    if (editableKeys.length === 0) continue;
    const sectionRaw = inputSections[section];
    if (!sectionRaw || typeof sectionRaw !== "object") continue;
    const sectionInput = sectionRaw as Record<string, unknown>;

    const acceptedKeys = new Set(editableKeys);
    const cleanedSection: Record<string, LocalizedCopy> = {};

    for (const key of Object.keys(sectionInput).sort()) {
      if (!acceptedKeys.has(key)) continue;
      const localizedRaw = sectionInput[key];
      if (!localizedRaw || typeof localizedRaw !== "object") continue;
      const localizedInput = localizedRaw as Record<string, unknown>;
      const cleanedLocalized: LocalizedCopy = {};

      for (const locale of LANDING_OVERRIDE_LOCALES) {
        const candidate = localizedInput[locale];
        if (typeof candidate !== "string") continue;
        const trimmed = candidate.trim();
        if (!trimmed) continue;
        const defaultValue = getLandingDefaultCopy(defaults[locale], key);
        if (trimmed === defaultValue) continue;
        cleanedLocalized[locale] = trimmed;
      }

      if (Object.keys(cleanedLocalized).length > 0) {
        cleanedSection[key] = cleanedLocalized;
      }
    }

    if (Object.keys(cleanedSection).length > 0) {
      out[section] = cleanedSection;
    }
  }

  return out;
}
