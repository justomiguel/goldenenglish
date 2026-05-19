import type { StudentBadgeRowModel } from "@/types/studentBadges";

function earnedAtMs(row: StudentBadgeRowModel): number {
  if (!row.earnedAt) return 0;
  const ms = Date.parse(row.earnedAt);
  return Number.isNaN(ms) ? 0 : ms;
}

function lockedProgressPercent(row: StudentBadgeRowModel): number {
  return row.progress?.percent ?? 0;
}

function lockedProgressCurrent(row: StudentBadgeRowModel): number {
  return row.progress?.current ?? 0;
}

/**
 * Earned badges first (newest unlock first), then locked by descending progress.
 */
export function sortStudentBadgeDisplayRows(rows: StudentBadgeRowModel[]): StudentBadgeRowModel[] {
  return [...rows].sort((a, b) => {
    if (a.locked !== b.locked) {
      return a.locked ? 1 : -1;
    }

    if (!a.locked) {
      return earnedAtMs(b) - earnedAtMs(a);
    }

    const percentDiff = lockedProgressPercent(b) - lockedProgressPercent(a);
    if (percentDiff !== 0) return percentDiff;

    const currentDiff = lockedProgressCurrent(b) - lockedProgressCurrent(a);
    if (currentDiff !== 0) return currentDiff;

    return a.badgeCode.localeCompare(b.badgeCode);
  });
}
