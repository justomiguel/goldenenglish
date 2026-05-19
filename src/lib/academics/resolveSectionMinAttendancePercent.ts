/** Site-wide fallback when DB / settings omit a value. */
export const DEFAULT_MIN_ATTENDANCE_PERCENT = 75;

export function clampMinAttendancePercent(raw: number): number {
  return Math.min(100, Math.max(0, Math.trunc(raw)));
}

/**
 * Resolves the effective minimum monthly attendance % for a section.
 * NULL / undefined section override inherits the tenant global default.
 */
export function resolveSectionMinAttendancePercent(
  sectionOverride: number | null | undefined,
  globalDefault: number,
): number {
  if (sectionOverride != null && Number.isFinite(sectionOverride)) {
    return clampMinAttendancePercent(sectionOverride);
  }
  return clampMinAttendancePercent(globalDefault);
}
