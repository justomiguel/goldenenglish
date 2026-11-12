const MAX_SHORT_NAME = 12;

export function shortNameFromBrand(name: string, explicit: string | null): string {
  const given = explicit?.trim() ?? "";
  if (given) return given.slice(0, MAX_SHORT_NAME);
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SHORT_NAME) return trimmed;
  const cut = trimmed.slice(0, MAX_SHORT_NAME);
  const space = cut.lastIndexOf(" ");
  if (space > 0) return cut.slice(0, space);
  return cut;
}
