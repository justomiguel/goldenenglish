import type { ParentAttendanceMark } from "@/lib/parent/loadParentRecentAttendance";

export type ParentAttendanceSectionGroup = {
  sectionId: string;
  sectionName: string;
  marks: ParentAttendanceMark[];
};

export type ParentAttendanceChildGroup = {
  studentId: string;
  studentName: string;
  sections: ParentAttendanceSectionGroup[];
};

export function groupParentRecentAttendance(
  marks: ParentAttendanceMark[],
  filterStudentId: string | null,
): ParentAttendanceChildGroup[] {
  const pool = filterStudentId
    ? marks.filter((m) => m.studentId === filterStudentId)
    : marks;

  const byChild = new Map<string, ParentAttendanceChildGroup>();
  for (const mark of pool) {
    let child = byChild.get(mark.studentId);
    if (!child) {
      child = { studentId: mark.studentId, studentName: mark.studentName, sections: [] };
      byChild.set(mark.studentId, child);
    }

    let section = child.sections.find((s) => s.sectionId === mark.sectionId);
    if (!section) {
      section = {
        sectionId: mark.sectionId,
        sectionName: mark.sectionName,
        marks: [],
      };
      child.sections.push(section);
    }
    section.marks.push(mark);
  }

  const groups = [...byChild.values()];
  for (const child of groups) {
    child.sections.sort((a, b) =>
      (b.marks[0]?.attendedOn ?? "").localeCompare(a.marks[0]?.attendedOn ?? ""),
    );
    for (const section of child.sections) {
      section.marks.sort((a, b) => b.attendedOn.localeCompare(a.attendedOn));
    }
    child.sections.sort((a, b) =>
      a.sectionName.localeCompare(b.sectionName, undefined, { sensitivity: "base" }),
    );
  }

  return groups.sort((a, b) =>
    a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }),
  );
}
