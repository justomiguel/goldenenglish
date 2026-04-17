/** One merged header cell spanning consecutive class days in the same UTC month. */
export type AttendanceMatrixMonthGroup = { key: string; label: string; span: number };

/**
 * Builds month labels for the attendance matrix header row (`classDays` ascending ISO dates).
 */
export function buildAttendanceMatrixMonthGroups(classDays: string[], locale: string): AttendanceMatrixMonthGroup[] {
  if (classDays.length === 0) return [];
  const ymFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const groups: AttendanceMatrixMonthGroup[] = [];
  let i = 0;
  while (i < classDays.length) {
    const ym = classDays[i]!.slice(0, 7);
    let span = 0;
    while (i + span < classDays.length && classDays[i + span]!.slice(0, 7) === ym) span += 1;
    groups.push({
      key: ym,
      label: ymFmt.format(new Date(`${ym}-01T12:00:00.000Z`)),
      span,
    });
    i += span;
  }
  return groups;
}
