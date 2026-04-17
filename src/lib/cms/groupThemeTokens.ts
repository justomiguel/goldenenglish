import {
  THEME_OVERRIDE_KEY_PREFIXES,
  type ThemePropertyOverrides,
} from "@/types/theming";
import type { ThemeProperties } from "@/lib/theme/themeParser";

/**
 * Pure helpers to render the design system editor.
 *
 * The editor is driven by `system.properties` keys: the file is the source of
 * truth for which tokens exist and their default values. The DB only stores
 * **overrides** keyed the same way, so the editor never invents tokens that the
 * runtime layer does not understand.
 */

export type TokenFieldKind = "color" | "shadow" | "text";

/** Closed list of editor groups, ordered for the UI. */
export const TOKEN_GROUP_IDS = [
  "color",
  "layout",
  "shadow",
  "app",
  "contact",
  "social",
] as const;

export type TokenGroupId = (typeof TOKEN_GROUP_IDS)[number];

export interface TokenDescriptor {
  /** Full property key, e.g. `color.primary` or `app.name`. */
  key: string;
  /** Effective value (override > default). Empty string when neither is set. */
  value: string;
  /** Default from `system.properties` (used to render the reset affordance). */
  defaultValue: string;
  /** Whether the editor is showing an override different from the default. */
  isOverridden: boolean;
  /** What kind of input renders this token. */
  kind: TokenFieldKind;
}

export interface TokenGroup {
  id: TokenGroupId;
  /** Tokens belonging to this group, sorted by key for stable rendering. */
  tokens: ReadonlyArray<TokenDescriptor>;
}

/** Maps a property key to its UI input kind. */
export function tokenFieldKindFromKey(key: string): TokenFieldKind {
  if (key.startsWith("color.")) return "color";
  if (key.startsWith("shadow.")) return "shadow";
  return "text";
}

/** Maps a property key to one of the editor groups, or null when the key is
 *  outside the allowed override surface (e.g. `legal.age.majority`). */
export function tokenGroupFromKey(key: string): TokenGroupId | null {
  for (const prefix of THEME_OVERRIDE_KEY_PREFIXES) {
    if (key.startsWith(prefix)) {
      // Prefix is "color.", "layout.", … strip the trailing dot for the group id.
      const id = prefix.slice(0, -1) as TokenGroupId;
      return TOKEN_GROUP_IDS.includes(id) ? id : null;
    }
  }
  return null;
}

function isEditableKey(key: string): boolean {
  return tokenGroupFromKey(key) !== null;
}

/**
 * Builds the editor view-model from defaults + overrides.
 *
 * - Iterates over `defaults` so the editor always shows every token defined in
 *   `system.properties`, even when no override exists yet.
 * - Filters out keys outside `THEME_OVERRIDE_KEY_PREFIXES` so non-visual config
 *   (e.g. `legal.age.majority`, `analytics.timezone`) never leaks into the UI.
 * - Returns groups in the canonical order from `TOKEN_GROUP_IDS`; empty groups
 *   are omitted so the UI does not render hollow cards.
 */
export function groupThemeTokens(
  defaults: ThemeProperties,
  overrides: ThemePropertyOverrides | null | undefined,
): ReadonlyArray<TokenGroup> {
  const overridesMap = overrides ?? {};
  const buckets = new Map<TokenGroupId, TokenDescriptor[]>();
  for (const id of TOKEN_GROUP_IDS) buckets.set(id, []);

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (!isEditableKey(key)) continue;
    const groupId = tokenGroupFromKey(key);
    if (!groupId) continue;

    const overrideRaw = overridesMap[key];
    const override =
      typeof overrideRaw === "string" ? overrideRaw.trim() : "";
    const effective = override || defaultValue;
    const isOverridden = override.length > 0 && override !== defaultValue;

    buckets.get(groupId)!.push({
      key,
      value: effective,
      defaultValue,
      isOverridden,
      kind: tokenFieldKindFromKey(key),
    });
  }

  const out: TokenGroup[] = [];
  for (const id of TOKEN_GROUP_IDS) {
    const tokens = buckets.get(id)!;
    if (tokens.length === 0) continue;
    tokens.sort((a, b) => a.key.localeCompare(b.key));
    out.push({ id, tokens });
  }
  return out;
}

/**
 * Pure: validates a single token edit. Returns the trimmed value when it
 * should be persisted, or `null` when the field should be cleared (i.e. fall
 * back to the default from `system.properties`).
 */
export function normalizeTokenValueForPersistence(
  key: string,
  raw: string,
  defaultValue: string,
): { action: "set"; value: string } | { action: "clear" } | { action: "noop" } {
  if (!isEditableKey(key)) return { action: "noop" };
  const trimmed = raw.trim();
  if (!trimmed) return { action: "clear" };
  if (trimmed === defaultValue) return { action: "clear" };
  return { action: "set", value: trimmed };
}
