import type { ThemeProperties } from "@/lib/theme/themeParser";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";

let cachedProps: ThemeProperties | null = null;

function getProps(): ThemeProperties {
  if (!cachedProps) cachedProps = loadProperties();
  return cachedProps;
}

function readBoundedInt(key: string, fallback: number, min: number, max: number): number {
  const raw = getProperty(getProps(), key, String(fallback)).trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Extra civil days when resolving scan min from operational floor (aligns slots across week boundary). */
export function getTeacherAttendanceMatrixScanLookbackBufferDays(): number {
  return readBoundedInt("academics.attendance.matrix.teacher.scanLookbackBufferDays", 7, 0, 31);
}

/** Civil days behind institute “today” for the teacher operational matrix floor. */
export function getTeacherAttendanceOperationalCivilLookbackDays(): number {
  return readBoundedInt("academics.attendance.matrix.teacher.operationalCivilLookbackDays", 14, 1, 180);
}

/** Max class-day columns in teacher `scope=operational`. */
export function getTeacherAttendanceOperationalMaxClassDays(): number {
  return readBoundedInt("academics.attendance.matrix.teacher.operationalMaxClassDays", 28, 4, 400);
}

/** Default max class-day columns for teacher full-course matrix / cap when `maxClassDays` omitted. */
export function getTeacherAttendanceFullCourseMaxClassDays(): number {
  return readBoundedInt("academics.attendance.matrix.teacher.fullCourseMaxClassDays", 156, 10, 800);
}

/** When section has no valid `starts_on`, civil lookback from today for matrix lower bound (admin/teacher). */
export function getAdminAttendanceMatrixFallbackLookbackDays(): number {
  return readBoundedInt("academics.attendance.matrix.admin.fallbackLookbackDays", 400, 30, 5000);
}

/** Max class-day columns in admin attendance matrix. */
export function getAdminAttendanceMatrixMaxClassDays(): number {
  return readBoundedInt("academics.attendance.matrix.admin.maxClassDays", 520, 50, 3000);
}

/** Civil-day search radius when snapping a requested date to the next/previous class day. */
export function getAttendanceMatrixPickAdjacentCivilDays(): number {
  return readBoundedInt("academics.attendance.matrix.pickAdjacentCivilDays", 14, 1, 60);
}

/** Safety cap on civil-day steps in `hasEligibleClassDayInWindow`. */
export function getAttendanceMatrixHasEligibleWindowMaxScans(): number {
  return readBoundedInt("academics.attendance.matrix.hasEligibleWindowMaxScans", 400, 50, 2000);
}
