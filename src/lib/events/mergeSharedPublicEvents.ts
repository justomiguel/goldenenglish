export function mergeSharedPublicEvents<T extends { slug: string }>(input: {
  local: readonly T[];
  shared: readonly T[];
}): { rows: T[]; hiddenSlugs: string[] } {
  const localSlugs = new Set(input.local.map((row) => row.slug));
  const hiddenSlugs: string[] = [];
  const sharedRows: T[] = [];
  for (const row of input.shared) {
    if (localSlugs.has(row.slug)) {
      hiddenSlugs.push(row.slug);
      continue;
    }
    sharedRows.push(row);
  }
  return { rows: [...input.local, ...sharedRows], hiddenSlugs };
}
