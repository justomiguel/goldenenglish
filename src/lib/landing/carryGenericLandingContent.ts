import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";
import { genericLandingCopyKeys } from "@/lib/cms/genericLandingCopyKeys";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import { LANDING_OVERRIDE_LOCALES } from "@/lib/cms/landingContentCatalog";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";
import type {
  LandingSectionSlug,
  LocalizedCopy,
  SiteThemeContent,
  SiteThemeSectionContent,
} from "@/types/theming";
import { LANDING_SECTION_SLUGS } from "@/types/theming";

/**
 * Copies the text a visitor already sees onto the next free template.
 * Slot keys differ only by kind (`genericLandings.deportes.title` →
 * `genericLandings.jardin.title`). Shared labels stay on the same key.
 */
export function carryGenericLandingContent(
  content: SiteThemeContent | null | undefined,
  fromKind: GenericInstituteKind,
  toKind: GenericInstituteKind,
  defaults: Readonly<Record<LandingOverrideLocale, Dictionary>>,
): SiteThemeContent {
  const next: Partial<Record<LandingSectionSlug, SiteThemeSectionContent>> = {};
  for (const section of LANDING_SECTION_SLUGS) {
    const current = content?.[section];
    if (current) next[section] = { ...current };
  }
  if (fromKind === toKind) return next;

  for (const section of LANDING_SECTION_SLUGS) {
    const toKeys = genericLandingCopyKeys(toKind, section);
    const fromKeys = new Set(genericLandingCopyKeys(fromKind, section));
    for (const toKey of toKeys) {
      const fromKey = toKey.replaceAll(`genericLandings.${toKind}.`, `genericLandings.${fromKind}.`);
      if (!fromKeys.has(fromKey)) continue;
      for (const locale of LANDING_OVERRIDE_LOCALES) {
        const value = readEffective(content, fromKey, locale, defaults);
        const toDefault = getLandingDefaultCopy(defaults[locale], toKey).trim();
        writeLocale(next, section, toKey, locale, value && value !== toDefault ? value : "");
      }
    }
  }
  return next;
}

function readEffective(
  content: SiteThemeContent | null | undefined,
  key: string,
  locale: LandingOverrideLocale,
  defaults: Readonly<Record<LandingOverrideLocale, Dictionary>>,
): string {
  for (const section of LANDING_SECTION_SLUGS) {
    const value = content?.[section]?.[key]?.[locale];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return getLandingDefaultCopy(defaults[locale], key).trim();
}

function writeLocale(
  next: Partial<Record<LandingSectionSlug, SiteThemeSectionContent>>,
  section: LandingSectionSlug,
  key: string,
  locale: LandingOverrideLocale,
  value: string,
): void {
  const bag: Record<string, LocalizedCopy> = { ...(next[section] ?? {}) };
  const localized: LocalizedCopy = { ...(bag[key] ?? {}) };
  if (!value) delete localized[locale];
  else localized[locale] = value;
  if (Object.keys(localized).length === 0) delete bag[key];
  else bag[key] = localized;
  if (Object.keys(bag).length === 0) delete next[section];
  else next[section] = bag;
}
