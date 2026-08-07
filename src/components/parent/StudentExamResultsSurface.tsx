"use client";

import type { StudentExamResult } from "@/types/studentExams";
import type { StudentExamCopy } from "@/lib/parent/formatStudentExamLabels";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { StudentExamResultsDesktop } from "@/components/desktop/organisms/StudentExamResultsDesktop";
import { StudentExamResultsPwaList } from "@/components/pwa/organisms/StudentExamResultsPwaList";

export interface StudentExamResultsSurfaceProps {
  locale: string;
  exams: StudentExamResult[];
  copy: StudentExamCopy;
}

function ExamsSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-muted)]" />
      <div className="h-16 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
      <div className="h-16 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
    </div>
  );
}

/** Tier A switch between the pointer-first exam list and the touch-first one. */
export function StudentExamResultsSurface({
  locale,
  exams,
  copy,
}: StudentExamResultsSurfaceProps) {
  return (
    <SurfaceMountGate
      skeleton={<ExamsSkeleton />}
      desktop={<StudentExamResultsDesktop locale={locale} exams={exams} copy={copy} />}
      narrow={() => <StudentExamResultsPwaList locale={locale} exams={exams} copy={copy} />}
    />
  );
}
