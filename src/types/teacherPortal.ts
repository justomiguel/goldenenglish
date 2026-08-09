export type TeacherRosterRow = {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
  avatarDisplayUrl: string | null;
  /** Marker only: this student has care notes. The text is never loaded here. */
  hasCareNotes: boolean;
};

export type TeacherTransferTargetOption = {
  id: string;
  label: string;
  atCapacity: boolean;
  activeCount: number;
  maxStudents: number;
};

export type TeacherAttendancePreviewRow = {
  date: string;
  status: string;
};
