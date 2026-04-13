export type StudentHubSectionRow = {
  enrollmentId: string;
  status: string;
  sectionName: string;
  cohortName: string;
  teacherDisplayName: string;
  scheduleSlots: unknown;
  friendlySchedule: string;
  createdAt: string;
};

export type StudentHubJourneyItem = {
  title: string;
  /** Raw enrollment status for dictionary lookup in UI. */
  status: string;
  scheduleLine: string;
  variant: "active" | "past";
  /** Section enrollment id for section-scoped attendance. */
  enrollmentId?: string;
  /** Month attendance % from section_attendance (null if no rows this month). */
  attendanceMonthPct: number | null;
};

export type StudentHubTransferPing = {
  reviewedAt: string;
};

export type StudentGradeRubricPoint = {
  subjectLabel: string;
  value: number;
  fullMark: number;
};

export type StudentHubPublishedGrade = {
  enrollmentId: string;
  assessmentId: string;
  sectionName: string;
  assessmentName: string;
  assessmentOn: string;
  maxScore: number;
  score: number;
  rubricData: Record<string, number>;
  rubricLabels: Record<string, string>;
  radarPoints: StudentGradeRubricPoint[];
  teacherFeedback: string | null;
};

export type StudentHubModel = {
  sections: StudentHubSectionRow[];
  journey: StudentHubJourneyItem[];
  approvedTransfers: StudentHubTransferPing[];
  billingPending: boolean;
  publishedGrades: StudentHubPublishedGrade[];
};
