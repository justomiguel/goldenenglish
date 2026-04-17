export type TeacherSectionAvgTone = "neutral" | "ok" | "warning" | "danger";

/**
 * Pure mapping of a published section average to a "traffic light" tone for the
 * teacher home table. Mirrors academic thresholds: ≥ 7 ok, 5–6.99 warning, < 5 danger.
 */
export function teacherSectionAvgTone(avg: number | null | undefined): TeacherSectionAvgTone {
  if (avg == null || !Number.isFinite(avg)) return "neutral";
  if (avg >= 7) return "ok";
  if (avg >= 5) return "warning";
  return "danger";
}
