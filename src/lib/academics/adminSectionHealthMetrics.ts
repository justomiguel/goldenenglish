/** Attendance rate: present + late + excused over all recorded marks (same formula as admin health panel). */
export function computeAttendanceRatePct(
  present: number,
  absent: number,
  late: number,
  excused: number,
): number | null {
  const denom = present + absent + late + excused;
  if (denom <= 0) return null;
  return Math.min(100, Math.round(((present + late + excused) / denom) * 100));
}

export function computeCapacityUtilizationPct(activeStudents: number, effectiveMaxStudents: number): number | null {
  if (effectiveMaxStudents <= 0) return null;
  return Math.min(100, Math.round((activeStudents / effectiveMaxStudents) * 100));
}

export function computeAssessmentCoveragePct(
  publishedGradeRows: number,
  cohortAssessmentCount: number,
  activeStudents: number,
): number | null {
  const expected = cohortAssessmentCount > 0 && activeStudents > 0 ? cohortAssessmentCount * activeStudents : 0;
  if (expected <= 0) return null;
  return Math.min(100, Math.round((publishedGradeRows / expected) * 100));
}
