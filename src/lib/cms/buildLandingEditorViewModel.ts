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
import { sectionImageSrc } from "@/lib/landing/sectionLandingImages";

/** Resolves a Storage object path to its public URL. The server caller
 *  injects this so the pure builder stays free of Supabase env access; in
 *  tests or environments without Supabase env it can simply return null. */
export type LandingMediaPublicUrlResolver = (
  storagePath: string,
) => string | null;

const NULL_PUBLIC_URL_RESOLVER: LandingMediaPublicUrlResolver = () => null;

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
  /** Resolved public URL for the override (when present and reachable). The
   *  server pre-computes this so client components do not need a function
   *  prop crossing the RSC boundary. */
  currentPublicUrl: string | null;
  /** Bundled `/images/sections/<slug>/<position>.png` fallback URL. */
  fallbackPublicUrl: string;
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
  /** Optional resolver that turns a Storage path into a public URL. When
   *  omitted the resulting `currentPublicUrl` is `null` (e.g. unit tests, or
   *  environments without Supabase env vars). */
  resolveMediaPublicUrl?: LandingMediaPublicUrlResolver;
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
  const resolveUrl = args.resolveMediaPublicUrl ?? NULL_PUBLIC_URL_RESOLVER;
  const media: LandingMediaSlotDescriptor[] = [];
  for (let position = 1; position <= slotsTotal; position += 1) {
    const current = sectionMedia.find((row) => row.position === position) ?? null;
    media.push({
      position,
      current,
      currentPublicUrl: current ? resolveUrl(current.storagePath) : null,
      fallbackPublicUrl: sectionImageSrc(section, `${position}.png`),
    });
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
