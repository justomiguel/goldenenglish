/** @typedef {"slug_comparison"|"slug_table"|"slug_file_name"|"slug_css"|"slug_dictionary"} HardcodeCode */
/** @typedef {{ path: string, line: number, code: HardcodeCode, slug: string }} HardcodeHit */

const ALLOWED_ROOT = /(?:^|\/)(?:__tests__|e2e|docs|supabase|scripts|public)(?:\/|$)/;

/**
 * @param {string} filePath
 * @param {string} slug
 */
export function isAllowedPath(filePath, slug) {
  const norm = filePath.replaceAll("\\", "/");
  if (ALLOWED_ROOT.test(norm)) return true;
  return norm.includes(`/variants/owned/${slug}/`);
}

/**
 * @param {string} filePath
 * @param {string} slug
 */
function fileNameHasSlug(filePath, slug) {
  const base = filePath.split("/").pop() ?? "";
  const stem = base.replace(/\.[^.]+$/, "");
  if (new RegExp(`(?:^|[^a-zA-Z0-9])${slug}(?:[^a-zA-Z0-9]|[A-Z]|$)`).test(stem)) return true;
  return new RegExp(`^${slug}(?=[A-Z]|$)`).test(stem);
}

/**
 * @param {string} line
 * @param {string} slug
 */
function comparisonHit(line, slug) {
  return new RegExp(
    `(?:===|!==|==|!=)\\s*['"]${slug}['"]|\\bcase\\s+['"]${slug}['"]`,
  ).test(line);
}

/**
 * @param {string} line
 * @param {string} slug
 */
function tableHit(line, slug) {
  if (comparisonHit(line, slug)) return false;
  const key = new RegExp(`(?:^|[{,])\\s*['"]?${slug}['"]?\\s*:`).test(line);
  const item = new RegExp(`\\[[^\\]]*['"]${slug}['"][^\\]]*\\]`).test(line);
  return key || item;
}

/**
 * @param {string} line
 * @param {string} slug
 */
function cssHit(line, slug) {
  const selector = new RegExp(`(^|[^a-zA-Z0-9])\\.${slug}(?![a-zA-Z0-9])`).test(line);
  const variable = new RegExp(`--${slug}(?![a-zA-Z0-9])`).test(line);
  return selector || variable;
}

/**
 * @param {string} line
 * @param {string} slug
 */
function dictionaryHit(line, slug) {
  return new RegExp(`['"]${slug}['"]\\s*:`).test(line);
}

/**
 * @param {string} filePath
 * @param {string} text
 * @param {readonly string[]} slugs
 * @returns {HardcodeHit[]}
 */
export function matchInstituteHardcode(filePath, text, slugs) {
  const norm = filePath.replaceAll("\\", "/");
  const lines = text.split("\n");
  /** @type {HardcodeHit[]} */
  const hits = [];
  const ordered = [...slugs].sort((a, b) => b.length - a.length);
  for (const slug of ordered) {
    if (isAllowedPath(norm, slug)) continue;
    if (fileNameHasSlug(norm, slug)) {
      hits.push({ path: norm, line: 1, code: "slug_file_name", slug });
    }
    const dictionary = norm.includes("/dictionaries/");
    lines.forEach((line, index) => {
      const lineNo = index + 1;
      if (dictionary && dictionaryHit(line, slug)) {
        hits.push({ path: norm, line: lineNo, code: "slug_dictionary", slug });
        return;
      }
      if (comparisonHit(line, slug)) {
        hits.push({ path: norm, line: lineNo, code: "slug_comparison", slug });
      }
      if (tableHit(line, slug)) {
        hits.push({ path: norm, line: lineNo, code: "slug_table", slug });
      }
      if (cssHit(line, slug)) {
        hits.push({ path: norm, line: lineNo, code: "slug_css", slug });
      }
    });
  }
  return hits;
}
