export type SectionRosterRow = {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
  /** Marker only: this student has care notes. The text is never loaded here. */
  hasCareNotes?: boolean;
};
