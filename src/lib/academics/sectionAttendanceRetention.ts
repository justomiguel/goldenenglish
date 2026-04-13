import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

/** Count how many most-recent rows (in given order: newest first) are `absent`. */
export function countTrailingAbsences(
  rows: { attended_on: string; status: SectionAttendanceStatusDb }[],
): number {
  let n = 0;
  for (const r of rows) {
    if (r.status === "absent") n++;
    else break;
  }
  return n;
}
