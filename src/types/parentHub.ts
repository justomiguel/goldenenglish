export type ParentHubLogisticsRow = {
  studentId: string;
  childLabel: string;
  classLabel: string;
  scheduleHuman: string;
  active: boolean;
};

export type ParentHubUpdateRow = {
  reviewedAt: string;
  childFirstName: string;
  newSectionName: string;
};

export type ParentHubAttendanceLine = {
  studentId: string;
  childFirstName: string;
  pct: number;
};

export type ParentHubModel = {
  logisticsRows: ParentHubLogisticsRow[];
  scheduleOverlap: boolean;
  updates: ParentHubUpdateRow[];
  /** Optional .ics document (UTF-8) for download / share. */
  icsDocument: string | null;
  childPaymentPending: Record<string, boolean>;
  /** Month attendance % from section registers (active enrollments). */
  attendanceLines: ParentHubAttendanceLine[];
};
