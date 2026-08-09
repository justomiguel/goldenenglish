import type { ParentAttendanceSectionSummary } from "@/lib/parent/buildParentAttendanceSectionSummaries";
import type { StudentExamResult } from "@/types/studentExams";
import type { StudentLearningTaskRow } from "@/types/learningTasks";

export type ParentChildMetricId = "attendance" | "average" | "pendingTasks";
export type ParentChildMetricTone = "good" | "warn" | "neutral";

export interface ParentChildMetric {
  id: ParentChildMetricId;
  /** Percentage for attendance and average; null when there is nothing to show. */
  percent: number | null;
  /** Item count for `pendingTasks`; null for the percentage metrics. */
  count: number | null;
  tone: ParentChildMetricTone;
}

export interface BuildParentChildMetricsInput {
  now: Date;
  sectionId: string | null;
  attendanceSummaries: ParentAttendanceSectionSummary[];
  exams: StudentExamResult[];
  tasks: StudentLearningTaskRow[];
}

const PENDING_STATUSES = new Set<StudentLearningTaskRow["status"]>(["NOT_OPENED", "OPENED"]);

function attendanceMetric(input: BuildParentChildMetricsInput): ParentChildMetric {
  const summary = input.attendanceSummaries.find((s) => s.sectionId === input.sectionId);
  if (!summary || summary.monthPercent === null) {
    return { id: "attendance", percent: null, count: null, tone: "neutral" };
  }
  return {
    id: "attendance",
    percent: summary.monthPercent,
    count: null,
    tone: summary.monthPercent < summary.requiredMinPercent ? "warn" : "good",
  };
}

function averageMetric(input: BuildParentChildMetricsInput): ParentChildMetric {
  const scored = input.exams.filter(
    (exam) => exam.score !== null && exam.maxScore !== null && exam.maxScore > 0,
  );
  if (scored.length === 0) {
    return { id: "average", percent: null, count: null, tone: "neutral" };
  }
  const total = scored.reduce((sum, exam) => sum + (exam.score! / exam.maxScore!) * 100, 0);
  // Grading scales differ per institute, so the average is reported without a verdict.
  return {
    id: "average",
    percent: Math.round(total / scored.length),
    count: null,
    tone: "neutral",
  };
}

function pendingTasksMetric(input: BuildParentChildMetricsInput): ParentChildMetric {
  const pending = input.tasks.filter((task) => PENDING_STATUSES.has(task.status));
  const overdue = pending.some((task) => {
    const due = Date.parse(task.dueAt);
    return Number.isFinite(due) && due < input.now.getTime();
  });
  return {
    id: "pendingTasks",
    percent: null,
    count: pending.length,
    // Having homework is normal; missing its deadline is what a parent needs to see.
    tone: overdue ? "warn" : "neutral",
  };
}

export function buildParentChildMetrics(
  input: BuildParentChildMetricsInput,
): ParentChildMetric[] {
  return [attendanceMetric(input), averageMetric(input), pendingTasksMetric(input)];
}
