import { CalendarClock, CheckCircle2, Hourglass } from "lucide-react";
import type { StudentExamState } from "@/types/studentExams";
import {
  studentExamStateLabel,
  type StudentExamCopy,
} from "@/lib/parent/formatStudentExamLabels";

export interface StudentExamStateChipProps {
  state: StudentExamState;
  copy: StudentExamCopy;
}

const CHIP =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight";

const TONE: Record<StudentExamState, string> = {
  graded: "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
  pending: "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
  upcoming: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]",
};

const ICON: Record<StudentExamState, typeof CheckCircle2> = {
  graded: CheckCircle2,
  pending: Hourglass,
  upcoming: CalendarClock,
};

/**
 * Tells a family why an exam has no score yet, shared by both surfaces so "pending" never reads as
 * "failed" on one of them and not the other.
 */
export function StudentExamStateChip({ state, copy }: StudentExamStateChipProps) {
  const Icon = ICON[state];
  return (
    <span className={`${CHIP} ${TONE[state]}`}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {studentExamStateLabel(state, copy)}
    </span>
  );
}
