import type { StudentCourseCard, StudentCourseLesson } from "@/types/studentCourses";

export type CourseLessonStats = {
  completedCount: number;
  totalCount: number;
  percent: number;
  nextLesson: StudentCourseLesson | null;
  finished: boolean;
};

export type ContinueCourse = {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  percent: number;
  finished: boolean;
};

export function courseLessonStats(course: StudentCourseCard): CourseLessonStats {
  const lessons = course.modules.flatMap((module) => module.lessons);
  const completedCount = lessons.filter((lesson) => lesson.completed).length;
  const totalCount = lessons.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextLesson = lessons.find((lesson) => lesson.unlocked && !lesson.completed) ?? null;
  const finished = totalCount > 0 && completedCount === totalCount;
  return { completedCount, totalCount, percent, nextLesson, finished };
}

export function pickContinueCourse(courses: StudentCourseCard[]): ContinueCourse | null {
  const ranked = courses.map((course) => ({ course, stats: courseLessonStats(course) }));
  const chosen = ranked.find((row) => row.stats.nextLesson) ?? ranked.find((row) => row.stats.finished);
  if (!chosen) return null;
  const lesson =
    chosen.stats.nextLesson ??
    chosen.course.modules.flatMap((module) => module.lessons).at(-1) ??
    null;
  if (!lesson) return null;
  return {
    courseId: chosen.course.id,
    courseTitle: chosen.course.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    percent: chosen.stats.percent,
    finished: chosen.stats.finished,
  };
}

export function lessonPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}
