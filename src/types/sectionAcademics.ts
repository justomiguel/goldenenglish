export type SectionAttendanceStatusDb = "present" | "absent" | "late" | "excused";

export type SectionAttendanceRowModel = {
  enrollmentId: string;
  studentId: string;
  studentLabel: string;
  status: SectionAttendanceStatusDb;
  notes: string | null;
};
