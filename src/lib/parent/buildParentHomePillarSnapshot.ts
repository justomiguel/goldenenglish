import { DEFAULT_MIN_ATTENDANCE_PERCENT } from "@/lib/academics/resolveSectionMinAttendancePercent";
import type { ParentChildLastGrade } from "@/lib/parent/loadParentChildrenSummaries";

/** @deprecated Use `loadAcademicsSectionDefaults().minAttendancePercent` or resolved per-section values. */
export const PARENT_ATTENDANCE_OK_MIN_PERCENT = DEFAULT_MIN_ATTENDANCE_PERCENT;

export type ParentPillarLevel = "ok" | "attention" | "unknown";

export { type ParentChildLastGrade };

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

/**
 * No published grade is the normal state at the start of a term.
 * Presence of any grade means progress is visible — level "ok".
 * Absence of a grade is neutral ("unknown"), never alarming ("attention").
 */
export function resolveParentProgressLevel(
  lastPublishedGrade: ParentChildLastGrade | null | undefined,
): ParentPillarLevel {
  return lastPublishedGrade != null ? "ok" : "unknown";
}

export type ParentHomePillarSnapshot = {
  attendance: { level: ParentPillarLevel; monthPercent: number | null };
  messages: { level: ParentPillarLevel; staffInboundCount: number };
  payments: {
    level: ParentPillarLevel;
    hasOverdueMonthly: boolean;
    overdueInvoiceCount: number;
  };
  progress: { level: ParentPillarLevel; lastPublishedGrade: ParentChildLastGrade | null };
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
  /** Last published grade for the selected student. No new query needed — from summaries. */
  lastPublishedGrade?: ParentChildLastGrade | null;
}): ParentHomePillarSnapshot {
  const {
    selectedStudentId,
    attendanceByStudent,
    attendanceLevelByStudent,
    attendanceMinPercent = DEFAULT_MIN_ATTENDANCE_PERCENT,
    overdueByStudent,
    staffInboundCount,
    overdueInvoiceCount,
    lastPublishedGrade = null,
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
    progress: {
      level: resolveParentProgressLevel(lastPublishedGrade),
      lastPublishedGrade: lastPublishedGrade ?? null,
    },
  };
}
