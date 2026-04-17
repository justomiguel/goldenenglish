import type { Dictionary } from "@/types/i18n";
import type {
  LandingBlock,
  LandingSectionSlug,
  SiteThemeContent,
  SiteThemeMediaRow,
} from "@/types/theming";
import { LANDING_SECTION_SLUGS } from "@/types/theming";
import {
  LANDING_COPY_KEYS_BY_SECTION,
  LANDING_MEDIA_SLOTS_BY_SECTION,
  type LandingOverrideLocale,
} from "@/lib/cms/landingContentCatalog";
import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";

/**
 * Pure helpers that turn raw `site_themes.content` + media rows into the
 * shape consumed by the landing CMS editor UI.
 *
 * Split out from the server-only loader so the same logic can be unit tested
 * with synthetic dictionaries and rows.
 */

export interface LandingCopyFieldDescriptor {
  /** Dotted dict path under `landing.*`. */
  key: string;
  /** Default value per locale (read from the bundled dictionaries). */
  defaults: Readonly<Record<LandingOverrideLocale, string>>;
  /** Current override per locale, or `null` when none. */
  overrides: Readonly<Record<LandingOverrideLocale, string | null>>;
}

export interface LandingMediaSlotDescriptor {
  position: number;
  /** Existing row when an override has been uploaded for this slot. */
  current: SiteThemeMediaRow | null;
}

export interface LandingSectionEditorViewModel {
  section: LandingSectionSlug;
  copy: ReadonlyArray<LandingCopyFieldDescriptor>;
  media: ReadonlyArray<LandingMediaSlotDescriptor>;
  blocks: ReadonlyArray<LandingBlock>;
}

export interface LandingEditorOverviewItem {
  section: LandingSectionSlug;
  copyOverridesCount: number;
  mediaOverridesCount: number;
  copyFieldsTotal: number;
  mediaSlotsTotal: number;
  blocksCount: number;
}

interface BuildArgs {
  defaults: Readonly<Record<LandingOverrideLocale, Dictionary>>;
  content: SiteThemeContent | null | undefined;
  media: ReadonlyArray<SiteThemeMediaRow>;
  blocks: ReadonlyArray<LandingBlock>;
}

function getOverrideValue(
  content: SiteThemeContent | null | undefined,
  section: LandingSectionSlug,
  key: string,
  locale: LandingOverrideLocale,
): string | null {
  const sectionOverrides = content?.[section];
  if (!sectionOverrides) return null;
  const localized = sectionOverrides[key];
  if (!localized) return null;
  const value = localized[locale];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildLandingSectionEditorViewModel(
  section: LandingSectionSlug,
  args: BuildArgs,
): LandingSectionEditorViewModel {
  const editableKeys = LANDING_COPY_KEYS_BY_SECTION[section];
  const copy: LandingCopyFieldDescriptor[] = editableKeys.map((key) => ({
    key,
    defaults: {
      es: getLandingDefaultCopy(args.defaults.es, key),
      en: getLandingDefaultCopy(args.defaults.en, key),
    },
    overrides: {
      es: getOverrideValue(args.content, section, key, "es"),
      en: getOverrideValue(args.content, section, key, "en"),
    },
  }));

  const slotsTotal = LANDING_MEDIA_SLOTS_BY_SECTION[section];
  const sectionMedia = args.media.filter((row) => row.section === section);
  const media: LandingMediaSlotDescriptor[] = [];
  for (let position = 1; position <= slotsTotal; position += 1) {
    const current = sectionMedia.find((row) => row.position === position);
    media.push({ position, current: current ?? null });
  }

  const blocks = args.blocks
    .filter((block) => block.section === section)
    .slice()
    .sort((a, b) => a.position - b.position);

  return { section, copy, media, blocks };
}

export function buildLandingEditorOverview(
  args: BuildArgs,
): ReadonlyArray<LandingEditorOverviewItem> {
  return LANDING_SECTION_SLUGS.map((section) => {
    const view = buildLandingSectionEditorViewModel(section, args);
    const copyOverrides = view.copy.reduce((acc, field) => {
      const has = field.overrides.es !== null || field.overrides.en !== null;
      return acc + (has ? 1 : 0);
    }, 0);
    const mediaOverrides = view.media.reduce(
      (acc, slot) => acc + (slot.current ? 1 : 0),
      0,
    );
    return {
      section,
      copyOverridesCount: copyOverrides,
      mediaOverridesCount: mediaOverrides,
      copyFieldsTotal: view.copy.length,
      mediaSlotsTotal: view.media.length,
      blocksCount: view.blocks.length,
    };
  });
}
