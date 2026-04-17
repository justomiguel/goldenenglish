import type { ThemeProperties } from "@/lib/theme/themeParser";
import {
  THEME_OVERRIDE_KEY_PREFIXES,
  type ThemePropertyOverrides,
} from "@/types/theming";

/** Subset of token prefixes that are emitted as CSS custom properties. Other
 *  keys (`app.*`, `contact.*`) inform brand layer / metadata, not stylesheet. */
const CSS_VARIABLE_PREFIXES: ReadonlyArray<string> = [
  "color.",
  "layout.",
  "shadow.",
];

function isAllowedOverrideKey(key: string): boolean {
  return THEME_OVERRIDE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Pure: returns a new ThemeProperties with allowed override keys applied on
 *  top of `defaults`. Empty / unknown-prefix overrides are silently ignored
 *  so an admin cannot, e.g., overwrite `legal.age.majority` from the design
 *  system editor. */
export function mergeProperties(
  defaults: ThemeProperties,
  overrides: ThemePropertyOverrides | null | undefined,
): ThemeProperties {
  if (!overrides) return { ...defaults };
  const merged: ThemeProperties = { ...defaults };
  for (const [key, raw] of Object.entries(overrides)) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    if (!isAllowedOverrideKey(key)) continue;
    merged[key] = value;
  }
  return merged;
}

function keyToCssVar(key: string): string {
  return `--${key.replace(/\./g, "-")}`;
}

/** Filter to keys that actually drive CSS variables. */
function isCssVariableKey(key: string): boolean {
  return CSS_VARIABLE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Conservative sanitizer: avoid `<`, `>`, `{`, `}`, `;` (one declaration per
 *  line) and any newlines that could break out of the inline `<style>` block.
 *  Returns null if the value is unsafe — caller skips that key. */
export function sanitizeCssValue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/[<>{};]/.test(value)) return null;
  if (/[\n\r]/.test(value)) return null;
  return value;
}

/** Pure: builds the body of a `:root { ... }` block (without the wrapper)
 *  from a property map. Stable key ordering for snapshot tests. */
export function cssVariablesBlock(properties: ThemeProperties): string {
  const lines: string[] = [];
  const sortedEntries = Object.entries(properties)
    .filter(([key]) => isCssVariableKey(key))
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [key, raw] of sortedEntries) {
    const value = sanitizeCssValue(raw);
    if (!value) continue;
    lines.push(`  ${keyToCssVar(key)}: ${value};`);
  }
  return lines.join("\n");
}

/** Pure: full `<style>` body ready to inline in the document head. */
export function cssRootBlock(properties: ThemeProperties): string {
  const body = cssVariablesBlock(properties);
  if (!body) return ":root {}";
  return `:root {\n${body}\n}`;
}
