export const BACKUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function staleBackupNames(
  items: readonly { name: string; createdAt: string | null }[],
  now: number,
  maxAgeMs: number = BACKUP_MAX_AGE_MS,
): string[] {
  return items.flatMap((item) => {
    if (!item.name || item.name.includes("/") || item.name.includes("..")) return [];
    const created = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
    if (!Number.isFinite(created) || now - created < maxAgeMs) return [];
    return [item.name];
  });
}
