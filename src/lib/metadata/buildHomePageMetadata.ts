import type { Metadata } from "next";

/**
 * Home tab title is the brand once. `absolute` skips the root `%s | brand`
 * template so we do not emit "Brand | Brand" or an empty title.
 */
export function buildHomePageMetadata(brandName: string): Metadata {
  return { title: { absolute: brandName } };
}
