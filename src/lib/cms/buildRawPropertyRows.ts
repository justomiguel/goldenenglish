import {
  THEME_OVERRIDE_KEY_PREFIXES,
  type ThemePropertyOverrides,
} from "@/types/theming";
import type { ThemeProperties } from "@/lib/theme/themeParser";

/**
 * Pure helpers backing the "raw properties" editor (PR 5).
 *
 * The grouped editor (PR 3) renders one field per **known** token from
 * `system.properties`, which is what admins want 99% of the time. This editor
 * sits next to it for the long tail:
 *
 * - Overrides with keys the runtime already understands but that are not yet
 *   declared in `system.properties` (e.g. a new `color.seasonal-accent`).
 * - Inspection of the full properties map (defaults + overrides) in one place.
 *
 * These helpers stay framework-free so the action layer and component tests
 * can share them.
 */

export interface RawPropertyRow {
  /** Full key, e.g. `color.primary` or `social.tiktok`. */
  key: string;
  /** Value from `system.properties`. `null` when the key only exists as an override
   *  (e.g. a seasonal color that the defaults file does not declare). */
  defaultValue: string | null;
  /** Current override, or `null` when none. */
  overrideValue: string | null;
  /** Whether the override differs from the default (or exists with no default). */
  isOverridden: boolean;
}

/** Allow-list check: any key whose prefix belongs to `THEME_OVERRIDE_KEY_PREFIXES`. */
export function isAllowedOverrideKey(key: string): boolean {
  if (!key) return false;
  return THEME_OVERRIDE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Canonical comparator: primary sort by key, case-insensitive, stable. */
function byKeyAscending(a: RawPropertyRow, b: RawPropertyRow): number {
  return a.key.localeCompare(b.key);
}

/**
 * Builds one row per allow-listed key, merging defaults (from `system.properties`)
 * and current overrides. Keys outside the allow-list are filtered out so the
 * editor surface always matches what the runtime layer is willing to apply.
 *
 * Rules:
 * 1. Includes every allow-listed key in `defaults` (even without override).
 * 2. Includes every allow-listed override key, even when it has no default.
 * 3. `isOverridden` is true when the override is present and differs from the
 *    default (or has no default at all).
 * 4. Rows are alphabetically sorted by key for stable rendering and diffs.
 */
export function buildRawPropertyRows(
  defaults: ThemeProperties,
  overrides: ThemePropertyOverrides | null | undefined,
): ReadonlyArray<RawPropertyRow> {
  const overridesMap = overrides ?? {};
  const keys = new Set<string>();

  for (const key of Object.keys(defaults)) {
    if (isAllowedOverrideKey(key)) keys.add(key);
  }
  for (const key of Object.keys(overridesMap)) {
    if (isAllowedOverrideKey(key)) keys.add(key);
  }

  const rows: RawPropertyRow[] = [];
  for (const key of keys) {
    const defaultValue =
      typeof defaults[key] === "string" ? defaults[key] : null;
    const rawOverride = overridesMap[key];
    const overrideValue =
      typeof rawOverride === "string" && rawOverride.trim().length > 0
        ? rawOverride
        : null;
    const isOverridden =
      overrideValue !== null && overrideValue !== defaultValue;
    rows.push({ key, defaultValue, overrideValue, isOverridden });
  }

  rows.sort(byKeyAscending);
  return rows;
}

/**
 * Returns the merged draft map the UI keeps while editing. The initial draft
 * mirrors what PostgREST would return (overrides only), so submitting without
 * changes is idempotent. `null`/missing values here mean "no override".
 */
export function buildInitialRawDraft(
  rows: ReadonlyArray<RawPropertyRow>,
): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const row of rows) {
    if (row.overrideValue !== null) draft[row.key] = row.overrideValue;
  }
  return draft;
}
