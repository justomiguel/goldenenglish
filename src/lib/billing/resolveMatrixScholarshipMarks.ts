import {
  effectiveScholarshipPercentForPeriod,
  type ScholarshipRows,
} from "@/lib/billing/scholarshipPeriod";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type MatrixScholarshipCell = {
  month: number;
  year: number;
  status: string;
};

export type MatrixScholarshipMarks = {
  /** Common rate for the year — show under the student name, not on every cell. */
  chipPercent: number | null;
  /** Per-month mark (Jan = index 0). Null when the cell should not repeat the chip. */
  percentByMonth: Array<number | null>;
  hasParticularMonthMark: boolean;
};

function mostCommonPercent(values: Array<number | null>): number | null {
  if (values.length === 0) return null;
  const counts = new Map<string, { value: number | null; n: number }>();
  for (const value of values) {
    const key = value == null ? "null" : String(value);
    const prev = counts.get(key);
    if (prev) prev.n += 1;
    else counts.set(key, { value, n: 1 });
  }
  let best: { value: number | null; n: number } | null = null;
  let tied = false;
  for (const entry of counts.values()) {
    if (!best || entry.n > best.n) {
      best = entry;
      tied = false;
    } else if (entry.n === best.n) {
      tied = true;
    }
  }
  if (!best || tied) return null;
  return best.value;
}

function countsForUniformity(cell: MatrixScholarshipCell | undefined): boolean {
  if (!cell) return false;
  return cell.status !== "out-of-period" && cell.status !== "no-plan";
}

export function resolveMatrixScholarshipMarksFromPercents(
  rawByMonth: ReadonlyArray<number | null>,
  cells: readonly MatrixScholarshipCell[],
  year: number,
): MatrixScholarshipMarks {
  const relevant: Array<number | null> = [];
  for (const month of MONTHS) {
    const cell = cells.find((c) => c.month === month && c.year === year);
    if (!countsForUniformity(cell)) continue;
    relevant.push(rawByMonth[month - 1] ?? null);
  }

  const mode = mostCommonPercent(relevant);
  const chipPercent = mode != null && mode > 0 ? mode : null;
  const percentByMonth = MONTHS.map((month) => {
    const percent = rawByMonth[month - 1] ?? null;
    if (percent == null) return null;
    if (mode != null && percent === mode) return null;
    return percent;
  });

  return {
    chipPercent,
    percentByMonth,
    hasParticularMonthMark: percentByMonth.some((percent) => percent != null),
  };
}

/**
 * Scholarship on the collections matrix: a uniform rate is a name-chip fact.
 * Month cells only show a % when that month differs from the year's common rate.
 */
export function resolveMatrixScholarshipMarks(input: {
  scholarships: ScholarshipRows;
  year: number;
  cells: readonly MatrixScholarshipCell[];
}): MatrixScholarshipMarks {
  const rawByMonth = MONTHS.map((month) => {
    const percent = effectiveScholarshipPercentForPeriod(
      input.scholarships,
      input.year,
      month,
    );
    return percent > 0 ? percent : null;
  });
  return resolveMatrixScholarshipMarksFromPercents(rawByMonth, input.cells, input.year);
}

export function sectionCollectionsHasParticularScholarshipMonth(
  students: ReadonlyArray<{
    scholarships: ScholarshipRows;
    row: { cells: readonly MatrixScholarshipCell[] };
  }>,
  year: number,
): boolean {
  return students.some(
    (student) =>
      resolveMatrixScholarshipMarks({
        scholarships: student.scholarships,
        year,
        cells: student.row.cells,
      }).hasParticularMonthMark,
  );
}
