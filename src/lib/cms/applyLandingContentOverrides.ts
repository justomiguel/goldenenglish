import type { Dictionary } from "@/types/i18n";
import type {
  LandingSectionSlug,
  SiteThemeContent,
} from "@/types/theming";
import {
  isEditableLandingCopyKey,
  isLandingOverrideLocale,
  type LandingOverrideLocale,
} from "@/lib/cms/landingContentCatalog";

/**
 * Pure helpers for landing copy:
 *
 * - `getLandingDefaultCopy` — reads the default text from the dictionary at a
 *   given dotted path under `dict.landing`. Returns `""` when the path does
 *   not point at a string.
 * - `applyLandingContentOverrides` — returns a clone of the dictionary with
 *   the editable landing keys overlaid by the active theme's `content` map
 *   for the requested locale. Other locales' overrides are ignored.
 *
 * The dictionary itself is never mutated; we deep-clone the touched branches
 * so callers can pass either the cloned result or the original interchangeably.
 */
export function getLandingDefaultCopy(
  dict: Dictionary,
  path: string,
): string {
  const parts = path.split(".");
  let cursor: unknown = dict.landing;
  for (const segment of parts) {
    if (cursor == null || typeof cursor !== "object") return "";
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor : "";
}

interface MutableContainer {
  [key: string]: unknown;
}

function setDeep(
  root: MutableContainer,
  path: string,
  value: string,
): void {
  const parts = path.split(".");
  let cursor: MutableContainer = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const segment = parts[i]!;
    const existing = cursor[segment];
    if (existing == null || typeof existing !== "object") {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as MutableContainer;
  }
  cursor[parts[parts.length - 1]!] = value;
}

/**
 * Builds an effective dictionary by overlaying overrides from `content` on
 * the editable landing keys. The resulting object is a structural copy of the
 * `landing` branch; non-`landing` branches are reused by reference for speed.
 *
 * Selection rules:
 * 1. Only paths recognized by `isEditableLandingCopyKey` are honored.
 * 2. Only the requested locale's overrides apply (the other locale's text is
 *    rendered through its own request).
 * 3. Empty / whitespace-only override values fall back to the dictionary
 *    default so admins can clear an override by sending `""`.
 */
export function applyLandingContentOverrides(
  dict: Dictionary,
  content: SiteThemeContent | null | undefined,
  locale: string,
): Dictionary {
  if (!isLandingOverrideLocale(locale)) return dict;
  if (!content) return dict;

  const sections = Object.keys(content) as LandingSectionSlug[];
  if (sections.length === 0) return dict;

  let landingClone: MutableContainer | null = null;
  const ensureClone = (): MutableContainer => {
    if (!landingClone) {
      landingClone = structuredClone(dict.landing) as MutableContainer;
    }
    return landingClone;
  };

  for (const section of sections) {
    const sectionContent = content[section];
    if (!sectionContent) continue;
    for (const path of Object.keys(sectionContent)) {
      if (!isEditableLandingCopyKey(path)) continue;
      const localized = sectionContent[path];
      const value = localized?.[locale as LandingOverrideLocale];
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      setDeep(ensureClone(), path, trimmed);
    }
  }

  if (!landingClone) return dict;
  return { ...dict, landing: landingClone as unknown as Dictionary["landing"] };
}
