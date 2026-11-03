const TASK_DONE = new Set(["COMPLETED", "COMPLETED_LATE"]);

export type CourseTaskCount = { completed: number; total: number };

export function taskCountsByCourse(
  courses: readonly { id: string; sectionIds: readonly string[] }[],
  tasks: readonly { sectionId: string; status: string }[],
): Record<string, CourseTaskCount> {
  const counts: Record<string, CourseTaskCount> = {};
  for (const course of courses) {
    const sections = new Set(course.sectionIds);
    const matched = tasks.filter((task) => sections.has(task.sectionId));
    counts[course.id] = {
      total: matched.length,
      completed: matched.filter((task) => TASK_DONE.has(task.status)).length,
    };
  }
  return counts;
}

export function attendancePercent(rows: readonly { status: string }[]): number | null {
  if (rows.length === 0) return null;
  const good = rows.filter((row) => row.status === "present" || row.status === "late" || row.status === "excused").length;
  return Math.round((good / rows.length) * 100);
}

export type CourseAssessmentLine = { title: string; score: string };

export function latestAssessmentForSections(
  exams: readonly {
    sectionId?: string;
    name: string;
    score: number | null;
    maxScore: number | null;
    state: string;
    examOn: string;
  }[],
  sectionIds: readonly string[],
): CourseAssessmentLine | null {
  const allowed = new Set(sectionIds);
  const graded = exams
    .filter((exam) => exam.state === "graded" && exam.score !== null && exam.sectionId && allowed.has(exam.sectionId))
    .sort((a, b) => b.examOn.localeCompare(a.examOn));
  const latest = graded[0];
  if (!latest || latest.score === null) return null;
  const score = latest.maxScore === null ? String(latest.score) : `${latest.score}/${latest.maxScore}`;
  return { title: latest.name, score };
}

export function percentOf(completed: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((completed / total) * 100);
}

export type CourseResultView = {
  taskPercent: number | null;
  attendancePercent: number | null;
  assessment: CourseAssessmentLine | null;
};

export function courseResultViews(input: {
  courses: readonly { id: string; sectionIds: readonly string[] }[];
  tasks: readonly { sectionId: string; status: string }[];
  attendancePercent: number | null;
  exams: readonly {
    sectionId?: string;
    name: string;
    score: number | null;
    maxScore: number | null;
    state: string;
    examOn: string;
  }[];
}): Record<string, CourseResultView> {
  const tasksByCourse = taskCountsByCourse(input.courses, input.tasks);
  const views: Record<string, CourseResultView> = {};
  for (const course of input.courses) {
    const counts = tasksByCourse[course.id] ?? { completed: 0, total: 0 };
    views[course.id] = {
      taskPercent: percentOf(counts.completed, counts.total),
      attendancePercent: input.attendancePercent,
      assessment: latestAssessmentForSections(input.exams, course.sectionIds),
    };
  }
  return views;
}
