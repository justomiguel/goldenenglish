export function requestedRegistrationSectionIds(row: {
  preferred_section_id: string | null;
  additionalSectionIds?: string[] | null;
}): string[] {
  const ids: string[] = [];
  const preferred = row.preferred_section_id?.trim() ?? "";
  if (preferred) ids.push(preferred);
  for (const raw of row.additionalSectionIds ?? []) {
    const id = raw.trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}
