export function cohortSectionTeacherNames(input: {
  leadId: string | null;
  assistantIds: readonly string[];
  externalNames: readonly string[];
  nameById: ReadonlyMap<string, string>;
}): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | undefined) => {
    const name = raw?.trim() ?? "";
    if (!name) return;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };

  if (input.leadId) push(input.nameById.get(input.leadId));
  const assistants = input.assistantIds
    .map((id) => input.nameById.get(id))
    .filter((name): name is string => Boolean(name?.trim()))
    .toSorted((a, b) => a.localeCompare(b));
  for (const name of assistants) push(name);
  for (const name of input.externalNames) push(name);
  return names;
}
