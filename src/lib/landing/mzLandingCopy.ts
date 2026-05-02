import type { Dictionary } from "@/types/i18n";

/** Reads `dict.landing.mz.<dotted path>` as a string. */
export function mzLandingCopy(dict: Dictionary, dottedPath: string): string {
  const landing = dict.landing as Record<string, unknown>;
  const mzRoot = landing.mz;
  if (!mzRoot || typeof mzRoot !== "object") return "";
  let cursor: unknown = mzRoot;
  for (const segment of dottedPath.split(".")) {
    if (cursor == null || typeof cursor !== "object") return "";
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor : "";
}

export function mzLandingParagraphs(
  dict: Dictionary,
  basePath: string,
  count: number,
): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const t = mzLandingCopy(dict, `${basePath}.p${i}`).trim();
    if (t) out.push(t);
  }
  return out;
}
