import type { Dictionary } from "@/types/i18n";

export type MarketingLandingBrand = "mz" | "ez" | "nago" | "mm";

/** Reads `dict.landing.<brand>.<dotted path>` as a string. */
export function marketingLandingCopy(
  dict: Dictionary,
  brand: MarketingLandingBrand,
  dottedPath: string,
): string {
  const landing = dict.landing as Record<string, unknown>;
  const root = landing[brand];
  if (!root || typeof root !== "object") return "";
  let cursor: unknown = root;
  for (const segment of dottedPath.split(".")) {
    if (cursor == null || typeof cursor !== "object") return "";
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor : "";
}

export function marketingLandingParagraphs(
  dict: Dictionary,
  brand: MarketingLandingBrand,
  basePath: string,
  count: number,
): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const t = marketingLandingCopy(dict, brand, `${basePath}.p${i}`).trim();
    if (t) out.push(t);
  }
  return out;
}

/** Reads `dict.landing.mz.<dotted path>` as a string. */
export function mzLandingCopy(dict: Dictionary, dottedPath: string): string {
  return marketingLandingCopy(dict, "mz", dottedPath);
}

export function mzLandingParagraphs(
  dict: Dictionary,
  basePath: string,
  count: number,
): string[] {
  return marketingLandingParagraphs(dict, "mz", basePath, count);
}
