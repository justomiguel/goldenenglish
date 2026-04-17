import type { ParentChildLastGrade } from "@/lib/parent/loadParentChildrenSummaries";
import type { Dictionary } from "@/types/i18n";

export interface ParentChildLastGradeLineProps {
  locale: string;
  grade: ParentChildLastGrade | null;
  labels: Pick<
    Dictionary["dashboard"]["parent"],
    "summaryLastGrade" | "summaryLastGradeValue" | "summaryLastGradeEmpty"
  >;
}

/**
 * Tiny presentational pair (title + value) for the last published grade
 * surfaced in the parent home (mirrors `summaryAttendance` etc.).
 */
export function ParentChildLastGradeLine({ locale, grade, labels }: ParentChildLastGradeLineProps) {
  let value: string;
  if (!grade) {
    value = labels.summaryLastGradeEmpty;
  } else {
    const date = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${grade.assessmentOn}T00:00:00Z`));
    const score = formatGradeNumber(locale, grade.score);
    const max = formatGradeNumber(locale, grade.maxScore);
    value = labels.summaryLastGradeValue
      .replace("{score}", score)
      .replace("{max}", max)
      .replace("{assessment}", grade.assessmentName)
      .replace("{date}", date);
  }
  return (
    <div>
      <dt className="font-medium text-[var(--color-foreground)]">{labels.summaryLastGrade}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatGradeNumber(locale: string, n: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
}
