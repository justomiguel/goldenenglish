import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type TeacherAttendanceMatrixRow = {
  enrollmentId: string;
  studentLabel: string;
  /** Raw `section_enrollments.status` for styling and bulk rules. */
  enrollmentStatus: string;
  createdAt: string;
  updatedAt: string;
};

/** enrollmentId -> dateIso -> status from DB, or null when no row (empty cell). */
export type TeacherAttendanceMatrixCells = Record<string, Record<string, SectionAttendanceStatusDb | null>>;

export type TeacherAttendanceMatrixPayload = {
  classDays: string[];
  classDaysTruncated: boolean;
  rows: TeacherAttendanceMatrixRow[];
  cells: TeacherAttendanceMatrixCells;
  /** ISO date -> holiday label (may be empty). */
  holidayLabels: Record<string, string>;
};
