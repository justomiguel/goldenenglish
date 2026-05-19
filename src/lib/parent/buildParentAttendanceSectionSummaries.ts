import { sectionAttendanceMonthPresentPct } from "@/lib/academics/sectionAttendanceMonthPct";
import { resolveSectionMinAttendancePercent } from "@/lib/academics/resolveSectionMinAttendancePercent";
import {
  resolveParentAttendanceLevel,
  type ParentPillarLevel,
} from "@/lib/parent/buildParentHomePillarSnapshot";

export type ParentAttendanceSectionSummary = {
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  monthPercent: number | null;
  sessionsThisMonth: number;
  requiredMinPercent: number;
  level: ParentPillarLevel;
};

type AttendanceSlice = { attended_on: string; status: string };

type SectionKeyMeta = {
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
};

function sessionsInMonth(rows: AttendanceSlice[], year: number, month: number): number {
  return rows.filter((r) => {
    const p = r.attended_on.slice(0, 10).split("-").map(Number);
    return p[0] === year && p[1] === month;
  }).length;
}

export function buildParentAttendanceSectionSummaries(
  enrollmentMeta: Map<string, SectionKeyMeta>,
  rowsByEnrollment: Map<string, AttendanceSlice[]>,
  year: number,
  month: number,
  globalMinPercent: number,
  sectionMinOverrideBySectionId: Map<string, number | null> = new Map(),
): ParentAttendanceSectionSummary[] {
  const summaries: ParentAttendanceSectionSummary[] = [];

  for (const [enrollmentId, meta] of enrollmentMeta) {
    const rows = rowsByEnrollment.get(enrollmentId) ?? [];
    const monthPercent = sectionAttendanceMonthPresentPct(rows, year, month);
    const requiredMinPercent = resolveSectionMinAttendancePercent(
      sectionMinOverrideBySectionId.get(meta.sectionId),
      globalMinPercent,
    );
    summaries.push({
      ...meta,
      monthPercent,
      sessionsThisMonth: sessionsInMonth(rows, year, month),
      requiredMinPercent,
      level: resolveParentAttendanceLevel(monthPercent, requiredMinPercent),
    });
  }

  return summaries.sort((a, b) => {
    const byChild = a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" });
    if (byChild !== 0) return byChild;
    return a.sectionName.localeCompare(b.sectionName, undefined, { sensitivity: "base" });
  });
}

/** Worst section level for a student (any section below its threshold → attention). */
export function worstParentAttendanceLevelFromSummaries(
  summaries: ParentAttendanceSectionSummary[],
  studentId: string,
): ParentPillarLevel {
  const rows = summaries.filter((s) => s.studentId === studentId);
  if (!rows.length) return "unknown";
  if (rows.some((s) => s.level === "attention")) return "attention";
  if (rows.every((s) => s.level === "unknown")) return "unknown";
  return "ok";
}
