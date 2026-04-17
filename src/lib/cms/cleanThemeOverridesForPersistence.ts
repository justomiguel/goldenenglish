import {
  THEME_OVERRIDE_KEY_PREFIXES,
  type ThemePropertyOverrides,
} from "@/types/theming";
import type { ThemeProperties } from "@/lib/theme/themeParser";

/**
 * Pure: takes the raw override map from the editor and returns the subset
 * that should be persisted to `site_themes.properties`.
 *
 * Rules (mirrors what the runtime layer in `mergeProperties` already enforces,
 * plus admin-editor specific cleanup):
 *
 * 1. Drop keys outside the allow-list (`color.*`, `layout.*`, `shadow.*`,
 *    `app.*`, `contact.*`, `social.*`).
 * 2. Drop empty / whitespace-only values: an empty value in the editor means
 *    "fall back to the default from `system.properties`", so we don't store
 *    it as an override.
 * 3. Drop values that match the default exactly: same reason, no need to keep
 *    a no-op override sitting in the row.
 * 4. Keys are sorted alphabetically so the persisted JSONB stays diff-friendly
 *    in audits and snapshots.
 */
export function cleanThemeOverridesForPersistence(
  defaults: ThemeProperties,
  rawOverrides: Record<string, string>,
): ThemePropertyOverrides {
  const allowed = new Set<string>();
  for (const [key, value] of Object.entries(rawOverrides)) {
    if (typeof value !== "string") continue;
    if (!THEME_OVERRIDE_KEY_PREFIXES.some((p) => key.startsWith(p))) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed === defaults[key]) continue;
    allowed.add(key);
  }

  const sorted = Array.from(allowed).sort((a, b) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const key of sorted) {
    out[key] = rawOverrides[key].trim();
  }
  return out;
}
