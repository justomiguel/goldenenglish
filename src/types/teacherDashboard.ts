export type TeacherDashboardTodayClass = {
  sectionId: string;
  label: string;
  startTime: string;
  endTime: string;
};

export type TeacherDashboardSectionGrade = {
  sectionId: string;
  label: string;
  /** Mean of published per-enrollment averages; null when no grades yet or assistant-only access. */
  avgScore: number | null;
};

export type TeacherDashboardModel = {
  todayClasses: TeacherDashboardTodayClass[];
  retentionOpenCount: number;
  familyMessageAttentionCount: number;
  sectionGrades: TeacherDashboardSectionGrade[];
};
