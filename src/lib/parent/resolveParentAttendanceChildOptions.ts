import type {
  ParentAttendanceChildOption,
  ParentRecentAttendanceModel,
} from "@/lib/parent/loadParentRecentAttendance";

/** Linked students plus any student visible in active section summaries. */
export function resolveParentAttendanceChildOptions(
  model: ParentRecentAttendanceModel,
): ParentAttendanceChildOption[] {
  const byId = new Map<string, string>();

  for (const child of model.children) {
    if (child.studentName.trim()) {
      byId.set(child.studentId, child.studentName);
    } else {
      byId.set(child.studentId, child.studentId);
    }
  }

  for (const summary of model.sectionSummaries) {
    if (!byId.has(summary.studentId)) {
      byId.set(summary.studentId, summary.studentName || summary.studentId);
    }
  }

  return [...byId.entries()]
    .map(([studentId, studentName]) => ({ studentId, studentName }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }));
}
