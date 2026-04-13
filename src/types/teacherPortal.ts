export type TeacherRosterRow = {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
  avatarDisplayUrl: string | null;
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
