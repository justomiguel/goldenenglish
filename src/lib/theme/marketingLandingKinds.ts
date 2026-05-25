import type { SiteThemeKind } from "@/types/theming";

/** Landing shells that hide default chrome and use marketing footer/header behavior. */
export const MARKETING_FULL_BLEED_LANDING_KINDS = [
  "mozarthitos",
  "espaciozenit",
  "nago",
  "mimundo",
] as const satisfies ReadonlyArray<SiteThemeKind>;

export function isMarketingFullBleedLandingKind(
  kind: SiteThemeKind,
): boolean {
  return (MARKETING_FULL_BLEED_LANDING_KINDS as ReadonlyArray<string>).includes(
    kind,
  );
}

/** Templates that ship their own `<footer>` inside the landing main tree (no shell `LandingFooter`). */
export function marketingLandingSuppressesShellFooter(
  kind: SiteThemeKind,
): boolean {
  return kind === "espaciozenit" || kind === "nago" || kind === "mimundo";
}
