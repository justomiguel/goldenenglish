import { DEFAULT_MIN_ATTENDANCE_PERCENT } from "@/lib/academics/resolveSectionMinAttendancePercent";

/** @deprecated Use `loadAcademicsSectionDefaults().minAttendancePercent` or resolved per-section values. */
export const PARENT_ATTENDANCE_OK_MIN_PERCENT = DEFAULT_MIN_ATTENDANCE_PERCENT;

export type ParentPillarLevel = "ok" | "attention" | "unknown";

export function resolveParentAttendanceLevel(
  monthPercent: number | null,
  minPercent = DEFAULT_MIN_ATTENDANCE_PERCENT,
): ParentPillarLevel {
  if (monthPercent == null) return "unknown";
  if (monthPercent >= minPercent) return "ok";
  return "attention";
}

export function resolveParentMessagesLevel(staffInboundCount: number): ParentPillarLevel {
  return staffInboundCount > 0 ? "attention" : "ok";
}

export function resolveParentPaymentsLevel(params: {
  hasOverdueMonthly: boolean;
  overdueInvoiceCount: number;
}): ParentPillarLevel {
  if (params.hasOverdueMonthly || params.overdueInvoiceCount > 0) return "attention";
  return "ok";
}

export type ParentHomePillarSnapshot = {
  attendance: { level: ParentPillarLevel; monthPercent: number | null };
  messages: { level: ParentPillarLevel; staffInboundCount: number };
  payments: {
    level: ParentPillarLevel;
    hasOverdueMonthly: boolean;
    overdueInvoiceCount: number;
  };
};

export function buildParentHomePillarSnapshot(params: {
  selectedStudentId?: string;
  attendanceByStudent: Record<string, number>;
  /** When set, overrides level derived from aggregate % (per-section thresholds). */
  attendanceLevelByStudent?: Record<string, ParentPillarLevel>;
  attendanceMinPercent?: number;
  overdueByStudent: Record<string, boolean>;
  staffInboundCount: number;
  overdueInvoiceCount: number;
}): ParentHomePillarSnapshot {
  const {
    selectedStudentId,
    attendanceByStudent,
    attendanceLevelByStudent,
    attendanceMinPercent = DEFAULT_MIN_ATTENDANCE_PERCENT,
    overdueByStudent,
    staffInboundCount,
    overdueInvoiceCount,
  } = params;

  const monthPercent =
    selectedStudentId != null ? (attendanceByStudent[selectedStudentId] ?? null) : null;

  const attendanceLevel =
    selectedStudentId && attendanceLevelByStudent?.[selectedStudentId] != null
      ? attendanceLevelByStudent[selectedStudentId]!
      : resolveParentAttendanceLevel(monthPercent, attendanceMinPercent);

  const hasOverdueMonthly = selectedStudentId
    ? Boolean(overdueByStudent[selectedStudentId])
    : Object.values(overdueByStudent).some(Boolean);

  return {
    attendance: {
      level: attendanceLevel,
      monthPercent,
    },
    messages: {
      level: resolveParentMessagesLevel(staffInboundCount),
      staffInboundCount,
    },
    payments: {
      level: resolveParentPaymentsLevel({ hasOverdueMonthly, overdueInvoiceCount }),
      hasOverdueMonthly,
      overdueInvoiceCount,
    },
  };
}
