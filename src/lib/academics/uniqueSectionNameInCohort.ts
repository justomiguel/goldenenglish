/** Picks a section name not present in `taken` (mutates `taken`). */
export function allocateUniqueSectionName(baseName: string, taken: Set<string>): string {
  const base = baseName.trim() || "Section";
  let name = base;
  let n = 2;
  while (taken.has(name)) {
    name = `${base} (${n})`;
    n += 1;
  }
  taken.add(name);
  return name;
}
