/** Institute default: at or above this monthly % we treat attendance as "OK". */
export const PARENT_ATTENDANCE_OK_MIN_PERCENT = 75;

export type ParentPillarLevel = "ok" | "attention" | "unknown";

export function resolveParentAttendanceLevel(monthPercent: number | null): ParentPillarLevel {
  if (monthPercent == null) return "unknown";
  if (monthPercent >= PARENT_ATTENDANCE_OK_MIN_PERCENT) return "ok";
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
  overdueByStudent: Record<string, boolean>;
  staffInboundCount: number;
  overdueInvoiceCount: number;
}): ParentHomePillarSnapshot {
  const {
    selectedStudentId,
    attendanceByStudent,
    overdueByStudent,
    staffInboundCount,
    overdueInvoiceCount,
  } = params;

  const monthPercent =
    selectedStudentId != null ? (attendanceByStudent[selectedStudentId] ?? null) : null;

  const hasOverdueMonthly = selectedStudentId
    ? Boolean(overdueByStudent[selectedStudentId])
    : Object.values(overdueByStudent).some(Boolean);

  return {
    attendance: {
      level: resolveParentAttendanceLevel(monthPercent),
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
