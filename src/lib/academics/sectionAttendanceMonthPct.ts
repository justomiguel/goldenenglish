/** All-time window: same ratio as monthly helper but without month filter. Null if no rows. */
export function sectionAttendanceCyclePresentPct(
  rows: { attended_on: string; status: string }[],
): number | null {
  if (rows.length === 0) return null;
  const attended = rows.filter((r) =>
    ["present", "late", "excused"].includes(r.status),
  ).length;
  return Math.round((100 * attended) / rows.length);
}

/** Counts sessions in month; null if none. % = (present+late+excused) / total * 100 rounded. */
export function sectionAttendanceMonthPresentPct(
  rows: { attended_on: string; status: string }[],
  year: number,
  month: number,
): number | null {
  const inMonth = rows.filter((r) => {
    const p = r.attended_on.slice(0, 10).split("-").map(Number);
    const y = p[0];
    const m = p[1];
    return y === year && m === month;
  });
  if (inMonth.length === 0) return null;
  const attended = inMonth.filter((r) =>
    ["present", "late", "excused"].includes(r.status),
  ).length;
  return Math.round((100 * attended) / inMonth.length);
}
