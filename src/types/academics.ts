export type SectionEnrollmentStatus =
  | "active"
  | "completed"
  | "transferred"
  | "dropped";

export type SectionTransferRequestStatus = "pending" | "approved" | "rejected";

export type SectionScheduleSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type SectionEnrollmentConflict = {
  enrollmentId: string;
  sectionId: string;
  sectionName: string;
  cohortName: string;
  scheduleSlots: SectionScheduleSlot[];
};

export type PreviewSectionEnrollmentResult =
  | { ok: true; parentPaymentsPending?: boolean }
  | {
      ok: false;
      code: "SCHEDULE_OVERLAP" | "CAPACITY_EXCEEDED" | "ALREADY_ACTIVE" | "PARSE";
      conflicts?: SectionEnrollmentConflict[];
      targetSlots?: SectionScheduleSlot[];
      activeCount?: number;
      maxStudents?: number;
      parentPaymentsPending?: boolean;
    };
