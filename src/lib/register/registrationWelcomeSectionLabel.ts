/**
 * Section names for the single registration welcome mail.
 * Committed sections from the fee snapshot; otherwise the undecided fallback.
 */
export function registrationWelcomeSectionLabel(input: {
  feeSnapshot: unknown;
  committedSectionIds: string[];
  fallback: string;
}): string {
  if (input.committedSectionIds.length === 0) return input.fallback;
  const lines = (input.feeSnapshot as { lines?: unknown } | null)?.lines;
  if (!Array.isArray(lines)) return input.fallback;
  const byId = new Map<string, string>();
  for (const line of lines) {
    if (!line || typeof line !== "object") continue;
    const row = line as { sectionId?: unknown; sectionName?: unknown };
    const id = typeof row.sectionId === "string" ? row.sectionId : "";
    const name = typeof row.sectionName === "string" ? row.sectionName.trim() : "";
    if (id && name) byId.set(id, name);
  }
  const names = input.committedSectionIds
    .map((id) => byId.get(id))
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : input.fallback;
}
