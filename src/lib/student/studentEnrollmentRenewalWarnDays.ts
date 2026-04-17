import { getProperty, loadProperties } from "@/lib/theme/themeParser";

const KEY = "student.enrollment.renewal.warn.days";
const FALLBACK = 300;
const MIN = 1;
const MAX = 3650;

/** Reads `student.enrollment.renewal.warn.days` from `system.properties` (portal student renewal banner). */
export function getStudentEnrollmentRenewalWarnDaysFromSystem(): number {
  const props = loadProperties();
  const raw = getProperty(props, KEY, String(FALLBACK));
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < MIN || n > MAX) return FALLBACK;
  return n;
}
