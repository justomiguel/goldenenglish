export function categoryParentCreatesCycle(
  categoryId: string,
  parentId: string | null,
  parentById: ReadonlyMap<string, string | null>,
): boolean {
  if (!parentId) return false;
  if (parentId === categoryId) return true;
  const seen = new Set<string>([categoryId]);
  let cursor: string | null = parentId;
  while (cursor) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = parentById.get(cursor) ?? null;
  }
  return false;
}
