import { lessonIsUnlocked, type CourseProgressMode } from "@/lib/courses/lessonUnlock";
import { resolveCourseAccess } from "@/lib/courses/resolveCourseAccess";
import type { StudentCourseCard } from "@/types/studentCourses";

export type CourseAssemblyRow = {
  id: string;
  title: string;
  published: boolean;
  progressMode: CourseProgressMode;
  grantingSectionIds: readonly string[];
  personalGrant: "purchase" | "assignment" | null;
  modules: {
    id: string;
    title: string;
    sortOrder: number;
    lessons: { id: string; title: string; sortOrder: number; completed: boolean }[];
  }[];
};

export function assembleStudentCourses(input: {
  courses: readonly CourseAssemblyRow[];
  activeEnrollmentSectionIds: readonly string[];
}): StudentCourseCard[] {
  const cards: StudentCourseCard[] = [];

  for (const course of input.courses) {
    const access = resolveCourseAccess({
      published: course.published,
      grantingSectionIds: course.grantingSectionIds,
      activeEnrollmentSectionIds: input.activeEnrollmentSectionIds,
      personalGrant: course.personalGrant,
    });
    if (!access.visible) continue;

    const modules = [...course.modules].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    const flatLessons = modules.flatMap((module) =>
      [...module.lessons].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    );
    const completedIndexes = new Set(
      flatLessons.flatMap((lesson, index) => (lesson.completed ? [index] : [])),
    );
    const unlockById = new Map(
      flatLessons.map((lesson, index) => [
        lesson.id,
        lessonIsUnlocked({
          mode: course.progressMode,
          lessonIndex: index,
          completedIndexes,
        }),
      ]),
    );

    cards.push({
      id: course.id,
      title: course.title,
      origins: access.origins,
      progressMode: course.progressMode,
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: [...module.lessons]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            unlocked: unlockById.get(lesson.id) ?? false,
            completed: lesson.completed,
          })),
      })),
    });
  }

  return cards.sort((a, b) => a.title.localeCompare(b.title));
}
