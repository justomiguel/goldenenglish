"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { completeCourseLessonAction } from "@/app/[locale]/dashboard/student/courses/actions";
import type { CourseOrigin, StudentCourseCard } from "@/types/studentCourses";

export type StudentCourseListLabels = {
  originSection: string;
  originPurchase: string;
  originAssignment: string;
  locked: string;
  complete: string;
  completed: string;
  completing: string;
  completeFailed: string;
};

interface StudentCourseListProps {
  locale: string;
  courses: StudentCourseCard[];
  labels: StudentCourseListLabels;
  canComplete: boolean;
}

const ORIGIN_KEY: Record<CourseOrigin, keyof StudentCourseListLabels> = {
  section: "originSection",
  purchase: "originPurchase",
  assignment: "originAssignment",
};

export function StudentCourseList({ locale, courses, labels, canComplete }: StudentCourseListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function complete(lessonId: string) {
    setPendingId(lessonId);
    setFailedId(null);
    const result = await completeCourseLessonAction({ locale, lessonId });
    setPendingId(null);
    if (!result.ok) {
      setFailedId(lessonId);
      return;
    }
    router.refresh();
  }

  return (
    <ul className="space-y-6">
      {courses.map((course) => (
        <li key={course.id} className="space-y-3">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold text-[var(--color-foreground)]">{course.title}</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {course.origins.map((origin) => labels[ORIGIN_KEY[origin]]).join(" · ")}
            </p>
          </div>
          {course.modules.map((module) => (
            <section key={module.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{module.title}</h3>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--color-foreground)]">{lesson.title}</span>
                    {lesson.completed ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]">
                        <Check className="h-4 w-4" aria-hidden />
                        {labels.completed}
                      </span>
                    ) : null}
                    {!lesson.completed && !lesson.unlocked ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                        <Lock className="h-4 w-4" aria-hidden />
                        {labels.locked}
                      </span>
                    ) : null}
                    {canComplete && lesson.unlocked && !lesson.completed ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={pendingId === lesson.id}
                        onClick={() => void complete(lesson.id)}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                        {pendingId === lesson.id ? labels.completing : labels.complete}
                      </Button>
                    ) : null}
                    {failedId === lesson.id ? (
                      <p className="w-full text-sm text-[var(--color-error)]" role="alert">
                        {labels.completeFailed}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </li>
      ))}
    </ul>
  );
}
