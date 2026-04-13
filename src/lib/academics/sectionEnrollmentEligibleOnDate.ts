/** ISO date `YYYY-MM-DD` vs enrollment lifecycle for section roster on a class day. */
export function enrollmentEligibleForAttendanceOnDate(
  attendedOnIso: string,
  createdAtIso: string,
  status: string,
  updatedAtIso: string,
): boolean {
  const day = attendedOnIso.slice(0, 10);
  const createdDay = createdAtIso.slice(0, 10);
  if (createdDay > day) return false;

  if (status === "active" || status === "completed") return true;
  if (status === "dropped" || status === "transferred") {
    const leftDay = updatedAtIso.slice(0, 10);
    return leftDay >= day;
  }
  return false;
}
