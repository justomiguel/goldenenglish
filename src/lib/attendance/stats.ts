export type AttendanceRow = {
  attendance_date: string;
  status: "present" | "absent" | "justified";
  is_mandatory: boolean;
};

export function mandatoryAttendanceStats(rows: AttendanceRow[]) {
  const mandatory = rows.filter((r) => r.is_mandatory);
  const present = mandatory.filter((r) => r.status === "present").length;
  const absent = mandatory.filter((r) => r.status === "absent").length;
  const justified = mandatory.filter((r) => r.status === "justified").length;
  const total = mandatory.length;
  return { present, absent, justified, total };
}

/** Consecutive mandatory past classes marked present, from most recent date backward. */
export function consecutivePresentStreak(rows: AttendanceRow[]): number {
  const mandatory = [...rows].filter((r) => r.is_mandatory);
  mandatory.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  let n = 0;
  for (const r of mandatory) {
    if (r.status === "present") n += 1;
    else break;
  }
  return n;
}
