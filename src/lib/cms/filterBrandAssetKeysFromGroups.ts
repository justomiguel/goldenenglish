import type { TokenGroup } from "@/lib/cms/groupThemeTokens";

/** Keys edited via file upload in the theme editor — hide duplicate raw path fields. */
export const SITE_THEME_BRAND_ASSET_PATH_KEYS = new Set([
  "app.logo.path",
  "app.favicon.path",
  "app.favicon.bundle.prefix",
]);

export function filterBrandAssetKeysFromGroups(
  groups: ReadonlyArray<TokenGroup>,
): ReadonlyArray<TokenGroup> {
  return groups
    .map((g) => ({
      ...g,
      tokens: g.tokens.filter((t) => !SITE_THEME_BRAND_ASSET_PATH_KEYS.has(t.key)),
    }))
    .filter((g) => g.tokens.length > 0);
}
