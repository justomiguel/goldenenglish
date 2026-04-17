import type { LandingBlockKind } from "@/types/theming";

/**
 * Pure descriptors for the editable copy fields per block `kind`.
 *
 * Two responsibilities:
 *  - tell the editor UI which inputs to render for each kind (e.g. a
 *    `divider` only needs a centered title, not a body),
 *  - tell the validator which field is the "primary" one that MUST exist
 *    in at least one locale before the block can be created.
 *
 * The runtime catalog (`parseLandingBlocks`) stays more permissive on
 * read so existing data never disappears, but the editor enforces
 * sensible minimums on every new block.
 */

export type LandingBlockField = "title" | "body";

export const LANDING_BLOCK_FIELDS_BY_KIND: Readonly<
  Record<LandingBlockKind, ReadonlyArray<LandingBlockField>>
> = {
  card: ["title", "body"],
  callout: ["title", "body"],
  quote: ["title", "body"],
  feature: ["title", "body"],
  stat: ["title", "body"],
  cta: ["title", "body"],
  divider: ["title"],
};

export const LANDING_BLOCK_REQUIRED_FIELDS_BY_KIND: Readonly<
  Record<LandingBlockKind, ReadonlyArray<LandingBlockField>>
> = {
  card: ["title"],
  callout: ["title"],
  quote: ["body"],
  feature: ["title"],
  stat: ["title"],
  cta: ["title"],
  divider: ["title"],
};

export interface LandingBlockCopyShape {
  es: { title?: string; body?: string };
  en: { title?: string; body?: string };
}

export function landingBlockHasField(
  kind: LandingBlockKind,
  field: LandingBlockField,
): boolean {
  return LANDING_BLOCK_FIELDS_BY_KIND[kind].includes(field);
}

/**
 * True when the block has all required fields filled in **at least one**
 * locale. Empty / whitespace-only values count as missing.
 */
export function isLandingBlockCopyValid(
  kind: LandingBlockKind,
  copy: LandingBlockCopyShape,
): boolean {
  const required = LANDING_BLOCK_REQUIRED_FIELDS_BY_KIND[kind];
  for (const locale of ["es", "en"] as const) {
    const all = required.every((field) => {
      const value = copy[locale][field];
      return typeof value === "string" && value.trim().length > 0;
    });
    if (all) return true;
  }
  return false;
}
