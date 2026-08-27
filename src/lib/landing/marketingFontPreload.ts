export type MarketingFontPreloadRole = "lcp" | "lazy";

export function marketingFontPreload(role: MarketingFontPreloadRole): boolean {
  return role === "lcp";
}
