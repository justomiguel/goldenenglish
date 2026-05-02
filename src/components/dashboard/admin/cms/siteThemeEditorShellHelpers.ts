import type { TokenGroup, TokenGroupId } from "@/lib/cms/groupThemeTokens";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["editor"];

export function groupLabels(labels: Labels, id: TokenGroupId) {
  const map = labels.groups;
  return {
    title: map[id].title,
    description: map[id].description,
    resetToDefault: labels.resetToDefault,
    defaultLabel: labels.defaultLabel,
    overriddenLabel: labels.overriddenLabel,
  };
}

export function findDefaultValue(
  groups: ReadonlyArray<TokenGroup>,
  key: string,
): string {
  for (const g of groups) {
    const t = g.tokens.find((x) => x.key === key);
    if (t) return t.defaultValue;
  }
  return "";
}

export function emptyDraftFromGroups(
  groups: ReadonlyArray<TokenGroup>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of groups) {
    for (const t of g.tokens) out[t.key] = t.defaultValue;
  }
  return out;
}

export function isDraftDirty(
  groups: ReadonlyArray<TokenGroup>,
  draft: Record<string, string>,
): boolean {
  for (const g of groups) {
    for (const t of g.tokens) {
      if ((draft[t.key] ?? t.value) !== t.value) return true;
    }
  }
  return false;
}
