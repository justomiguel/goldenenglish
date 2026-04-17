export type StudentEnrollmentRenewalKind = "none" | "missing_paid" | "stale_paid";

/**
 * Pure rule: adult students (`!isMinor`) see a billing nudge when payment is missing or older than `warnDays`.
 * `warnDays` typically comes from `getStudentEnrollmentRenewalWarnDaysFromSystem()`.
 */
export function studentEnrollmentRenewalKind(
  isMinor: boolean,
  lastEnrollmentPaidAt: string | null,
  now: Date,
  warnDays: number,
): StudentEnrollmentRenewalKind {
  if (isMinor) return "none";
  const threshold = Number.isFinite(warnDays) && warnDays > 0 ? warnDays : 300;
  if (!lastEnrollmentPaidAt || lastEnrollmentPaidAt.trim() === "") return "missing_paid";
  const paid = new Date(lastEnrollmentPaidAt);
  if (Number.isNaN(paid.getTime())) return "missing_paid";
  const days = (now.getTime() - paid.getTime()) / 86400000;
  if (days > threshold) return "stale_paid";
  return "none";
}
