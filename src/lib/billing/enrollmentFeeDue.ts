import { periodIndex } from "@/lib/billing/scholarshipPeriod";

function yearMonthIndexFromIsoPrefix(
  iso: string | null,
  fallbackYear: number,
  fallbackMonth: number,
): number {
  const raw =
    iso && iso.length >= 7
      ? iso.slice(0, 7)
      : `${fallbackYear}-${String(fallbackMonth).padStart(2, "0")}`;
  const [yearRaw, monthRaw] = raw.split("-").map((n) => Number(n));
  const dueYear = Number.isFinite(yearRaw) ? yearRaw : fallbackYear;
  const dueMonth = Number.isFinite(monthRaw) ? monthRaw : fallbackMonth;
  return periodIndex(dueYear, dueMonth);
}

/** Same rule as section collections KPIs: overdue once “today” is after section/enrollment start month. */
export function enrollmentFeeIsOverduePrimitives(
  sectionStartsOn: string,
  enrolledAt: string | null,
  todayYear: number,
  todayMonth: number,
): boolean {
  const sectionStartIdx = yearMonthIndexFromIsoPrefix(
    sectionStartsOn,
    todayYear,
    todayMonth,
  );
  const enrolledIdx = enrolledAt
    ? yearMonthIndexFromIsoPrefix(enrolledAt, todayYear, todayMonth)
    : sectionStartIdx;
  const todayIdx = periodIndex(todayYear, todayMonth);
  return Math.max(sectionStartIdx, enrolledIdx) < todayIdx;
}
