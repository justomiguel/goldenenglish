/**
 * WCAG 2.1 contrast-ratio utilities.
 *
 * Both functions are pure and accept #RRGGBB hex strings (with or without the
 * leading '#', upper- or lower-case).
 *
 * **Malformed input** — if the hex string cannot be parsed (wrong length,
 * non-hex characters) `relativeLuminance` returns 0 (the darkest possible
 * luminance) and `contrastRatio` therefore returns 1 (no contrast).  Returning
 * the pessimistic value rather than throwing means a typo in a palette token
 * causes test assertions to *fail* (ratio too low) instead of crashing the
 * test suite mid-run, making the error easier to diagnose.
 */

/**
 * Linearise one sRGB channel in [0, 1].
 * Uses the WCAG 2.1 / IEC 61966-2-1 piecewise curve (threshold 0.03928).
 */
function linearise(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Parse a #RRGGBB hex string into [r, g, b] in [0, 1].
 * Returns null on failure so callers can choose the fallback.
 */
function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "").toLowerCase();
  if (clean.length !== 6 || !/^[0-9a-f]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

/**
 * WCAG 2.1 relative luminance of a hex colour.
 *
 * Returns a value in [0, 1]: 0 for black, 1 for white.
 * Returns 0 for malformed input (pessimistic: treated as black).
 */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(linearise);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.1 contrast ratio between two hex colours.
 *
 * Argument order is commutative — the function always divides the lighter
 * luminance by the darker one.
 *
 * Returns 1 if either colour is malformed (no contrast, worst case).
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
