/** UTC calendar date YYYY-MM-DD. */
export function utcCalendarDateIso(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive lower bound for teacher date picker (today − 2 UTC days). */
export function minTeacherAttendanceDateIso(now = new Date()): string {
  const x = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - 2);
  return x.toISOString().slice(0, 10);
}

export function isTeacherAttendanceDateAllowed(iso: string, now = new Date()): boolean {
  const min = minTeacherAttendanceDateIso(now);
  const max = utcCalendarDateIso(now);
  return iso >= min && iso <= max;
}
