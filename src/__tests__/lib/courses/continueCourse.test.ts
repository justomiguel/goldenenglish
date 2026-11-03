import { describe, expect, it } from "vitest";
import { courseLessonStats, lessonPlainText, pickContinueCourse } from "@/lib/courses/continueCourse";
import type { StudentCourseCard } from "@/types/studentCourses";

function course(overrides: Partial<StudentCourseCard> = {}): StudentCourseCard {
  return {
    id: "course-1",
    title: "Ballet 1",
    origins: ["section"],
    progressMode: "sequential",
    sectionIds: [],
    modules: [
      {
        id: "mod-1",
        title: "Mes 1",
        lessons: [
          { id: "les-1", title: "Postura", unlocked: true, completed: true },
          { id: "les-2", title: "Plié", unlocked: true, completed: false },
          { id: "les-3", title: "Tendu", unlocked: false, completed: false },
        ],
      },
    ],
    ...overrides,
  };
}

describe("courseLessonStats", () => {
  it("counts completed lessons and picks the next open one", () => {
    const stats = courseLessonStats(course());
    expect(stats.percent).toBe(33);
    expect(stats.nextLesson?.id).toBe("les-2");
    expect(stats.finished).toBe(false);
  });

  it("marks a course finished only when every lesson is complete", () => {
    const stats = courseLessonStats(
      course({
        modules: [
          {
            id: "mod-1",
            title: "Mes 1",
            lessons: [{ id: "les-1", title: "Postura", unlocked: true, completed: true }],
          },
        ],
      }),
    );
    expect(stats.percent).toBe(100);
    expect(stats.finished).toBe(true);
    expect(stats.nextLesson).toBeNull();
  });
});

describe("pickContinueCourse", () => {
  it("returns the first course that still has an open lesson", () => {
    const next = pickContinueCourse([
      course({
        id: "done",
        modules: [
          {
            id: "mod-done",
            title: "Listo",
            lessons: [{ id: "old", title: "Cierre", unlocked: true, completed: true }],
          },
        ],
      }),
      course(),
    ]);
    expect(next).toMatchObject({ courseId: "course-1", lessonId: "les-2", finished: false });
  });

  it("points a finished course at its last lesson", () => {
    const next = pickContinueCourse([
      course({
        modules: [
          {
            id: "mod-1",
            title: "Mes 1",
            lessons: [
              { id: "les-1", title: "Postura", unlocked: true, completed: true },
              { id: "les-2", title: "Plié", unlocked: true, completed: true },
            ],
          },
        ],
      }),
    ]);
    expect(next).toMatchObject({ lessonId: "les-2", percent: 100, finished: true });
  });

  it("returns null when there is no lesson", () => {
    expect(pickContinueCourse([])).toBeNull();
    expect(pickContinueCourse([course({ modules: [] })])).toBeNull();
  });
});

describe("lessonPlainText", () => {
  it("drops tags and scripts", () => {
    expect(lessonPlainText("<p>Hola</p><script>alert(1)</script>")).toBe("Hola");
  });
});
