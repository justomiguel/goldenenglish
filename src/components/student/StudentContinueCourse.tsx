import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface StudentContinueCourseProps {
  href: string;
  courseTitle: string;
  lessonTitle: string;
  percentLabel: string;
  cta: string;
}

export function StudentContinueCourse({
  href,
  courseTitle,
  lessonTitle,
  percentLabel,
  cta,
}: StudentContinueCourseProps) {
  return (
    <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-[var(--color-muted-foreground)]">{percentLabel}</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--color-foreground)]">{courseTitle}</h2>
      <p className="mt-1 text-sm text-[var(--color-foreground)]">{lessonTitle}</p>
      <Link
        href={href}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)] underline"
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
        {cta}
      </Link>
    </article>
  );
}
