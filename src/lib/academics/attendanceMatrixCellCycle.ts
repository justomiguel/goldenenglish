import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export function cyclePatTeacher(cur: SectionAttendanceStatusDb | null): "present" | "absent" | "late" {
  if (cur === null) return "present";
  if (cur === "present") return "absent";
  if (cur === "absent") return "late";
  return "present";
}

export function cyclePatAdmin(cur: SectionAttendanceStatusDb | null): SectionAttendanceStatusDb {
  if (cur === null) return "present";
  if (cur === "present") return "absent";
  if (cur === "absent") return "late";
  if (cur === "late") return "excused";
  return "present";
}
