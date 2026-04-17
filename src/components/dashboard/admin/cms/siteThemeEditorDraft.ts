import type { TokenGroup } from "@/lib/cms/groupThemeTokens";

/**
 * Builds the initial editor draft from the loaded view-model.
 *
 * Each token starts at its current effective value (override > default), so
 * the editor inputs render the right state on first paint without a flicker
 * and the dirty check stays trivial: any deviation from `token.value` means
 * the admin has staged a change.
 */
export function buildInitialDraft(
  groups: ReadonlyArray<TokenGroup>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of groups) {
    for (const t of g.tokens) {
      out[t.key] = t.value;
    }
  }
  return out;
}
