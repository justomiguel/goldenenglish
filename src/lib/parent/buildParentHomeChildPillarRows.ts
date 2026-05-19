import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import {
  resolveParentAttendanceLevel,
  resolveParentPaymentsLevel,
  type ParentPillarLevel,
} from "@/lib/parent/buildParentHomePillarSnapshot";

export interface ParentHomeChildPillarRow {
  studentId: string;
  displayName: string;
  level: ParentPillarLevel;
  detail: string;
}

export interface ParentHomeChildPillarLabels {
  attendanceOkDetail: string;
  attendanceAttentionDetail: string;
  attendanceUnknownDetail: string;
  paymentsOkDetail: string;
  paymentsAttentionDetail: string;
}

export interface ParentHomeChildSummaryInput {
  studentId: string;
  firstName: string;
  lastName: string;
}

function aggregateLevel(levels: ParentPillarLevel[]): ParentPillarLevel {
  if (levels.length === 0) return "unknown";
  if (levels.some((l) => l === "attention")) return "attention";
  if (levels.some((l) => l === "unknown")) return "unknown";
  return "ok";
}

export function buildParentHomeChildAttendanceRows(
  children: ParentHomeChildSummaryInput[],
  attendanceByStudent: Record<string, number>,
  labels: ParentHomeChildPillarLabels,
): ParentHomeChildPillarRow[] {
  return children.map((child) => {
    const monthPercent = attendanceByStudent[child.studentId] ?? null;
    const level = resolveParentAttendanceLevel(monthPercent);
    const displayName = formatProfileNameSurnameFirst(child.firstName, child.lastName);
    const detail =
      monthPercent != null
        ? level === "attention"
          ? labels.attendanceAttentionDetail.replace("{pct}", String(monthPercent))
          : labels.attendanceOkDetail.replace("{pct}", String(monthPercent))
        : labels.attendanceUnknownDetail;
    return { studentId: child.studentId, displayName, level, detail };
  });
}

export function buildParentHomeChildPaymentRows(
  children: ParentHomeChildSummaryInput[],
  overdueByStudent: Record<string, boolean>,
  labels: Pick<ParentHomeChildPillarLabels, "paymentsOkDetail" | "paymentsAttentionDetail">,
): ParentHomeChildPillarRow[] {
  return children.map((child) => {
    const hasOverdue = Boolean(overdueByStudent[child.studentId]);
    const level = resolveParentPaymentsLevel({
      hasOverdueMonthly: hasOverdue,
      overdueInvoiceCount: 0,
    });
    const displayName = formatProfileNameSurnameFirst(child.firstName, child.lastName);
    const detail = hasOverdue ? labels.paymentsAttentionDetail : labels.paymentsOkDetail;
    return { studentId: child.studentId, displayName, level, detail };
  });
}

export function aggregatePillarLevelFromChildRows(rows: ParentHomeChildPillarRow[]): ParentPillarLevel {
  return aggregateLevel(rows.map((r) => r.level));
}
