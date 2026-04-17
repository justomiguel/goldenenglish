/**
 * ISO date `YYYY-MM-DD` vs enrollment lifecycle for section roster on a class day.
 *
 * For `active` / `completed` enrollments the floor is `min(section.starts_on, created_at)`:
 * the teacher portal can register attendance from the section start even when the enrollment
 * row was created later (typical "we onboarded the student into the system mid-term" case).
 * For `dropped` / `transferred` the floor stays at `created_at` (the leave/transfer date is
 * the upper bound via `updated_at`, and earlier classes don't apply to this section).
 */
export function enrollmentEligibleForAttendanceOnDate(
  attendedOnIso: string,
  createdAtIso: string,
  status: string,
  updatedAtIso: string,
  opts?: { sectionStartsOn?: string | null },
): boolean {
  const day = attendedOnIso.slice(0, 10);
  const createdDay = createdAtIso.slice(0, 10);
  const startDay = opts?.sectionStartsOn?.slice(0, 10) ?? null;

  if (status === "active" || status === "completed") {
    const floor = startDay && startDay < createdDay ? startDay : createdDay;
    return floor <= day;
  }
  if (status === "dropped" || status === "transferred") {
    if (createdDay > day) return false;
    const leftDay = updatedAtIso.slice(0, 10);
    return leftDay >= day;
  }
  return false;
}
