/**
 * Pure helpers to inventory `data-tour` / tour prop literals against ADMIN_TOUR_ANCHORS.
 * Used by Vitest contract tests (rule 33).
 */

const LITERAL_ATTR_RE =
  /(?:data-tour|tourAnchor)=["']([^"']+)["']/g;
const TOUR_ID_PROP_RE = /tourId:\s*["']([^"']+)["']/g;

/** Extract tour anchor string literals from source text. */
export function extractTourAnchorLiterals(sourceText: string): string[] {
  const found = new Set<string>();
  for (const re of [LITERAL_ATTR_RE, TOUR_ID_PROP_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sourceText)) !== null) {
      if (m[1]) found.add(m[1]);
    }
  }
  return [...found].sort();
}

/**
 * True if the anchor appears as a quoted string literal, or via
 * `ADMIN_TOUR_ANCHORS.<key>` when `anchorKeyByValue` maps value → key.
 */
export function sourceMentionsAnchor(
  haystack: string,
  anchor: string,
  anchorKeyByValue?: ReadonlyMap<string, string>,
): boolean {
  if (haystack.includes(`"${anchor}"`) || haystack.includes(`'${anchor}'`)) {
    return true;
  }
  const key = anchorKeyByValue?.get(anchor);
  return Boolean(key && haystack.includes(`ADMIN_TOUR_ANCHORS.${key}`));
}

export function findMissingDeclaredAnchors(
  declared: readonly string[],
  haystack: string,
  anchorKeyByValue?: ReadonlyMap<string, string>,
): string[] {
  return declared
    .filter((a) => !sourceMentionsAnchor(haystack, a, anchorKeyByValue))
    .sort();
}

export function findOrphanTourAnchors(
  declared: ReadonlySet<string>,
  sourceText: string,
): string[] {
  return extractTourAnchorLiterals(sourceText).filter((a) => !declared.has(a));
}
