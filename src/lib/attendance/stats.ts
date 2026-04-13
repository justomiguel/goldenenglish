export type AttendanceRow = {
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
};

function isAttended(s: AttendanceRow["status"]): boolean {
  return s === "present" || s === "late";
}

export function attendanceStats(rows: AttendanceRow[]) {
  const present = rows.filter((r) => r.status === "present").length;
  const late = rows.filter((r) => r.status === "late").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const excused = rows.filter((r) => r.status === "excused").length;
  const total = rows.length;
  return { present, late, absent, excused, total };
}

export function attendanceStatsForMonth(
  rows: AttendanceRow[],
  year: number,
  month: number,
) {
  const filtered = rows.filter((r) => {
    const d = r.attendance_date;
    if (d.length < 7) return false;
    const parts = d.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    return y === year && m === month;
  });
  const attended = filtered.filter((r) => isAttended(r.status)).length;
  const total = filtered.length;
  return { attended, total };
}

export function consecutivePresentStreak(rows: AttendanceRow[]): number {
  const sorted = [...rows].sort(
    (a, b) => b.attendance_date.localeCompare(a.attendance_date),
  );
  let n = 0;
  for (const r of sorted) {
    if (isAttended(r.status)) n += 1;
    else break;
  }
  return n;
}

/** @deprecated Use attendanceStats. Kept for backward compatibility during migration. */
export function mandatoryAttendanceStats(rows: AttendanceRow[]) {
  return attendanceStats(rows);
}

/** @deprecated Use attendanceStatsForMonth. */
export function mandatoryAttendanceStatsForMonth(
  rows: AttendanceRow[],
  year: number,
  month: number,
) {
  const r = attendanceStatsForMonth(rows, year, month);
  return { present: r.attended, total: r.total };
}
