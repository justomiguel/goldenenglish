import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface ParentContactTeacherCtaProps {
  locale: string;
  assignedTeacherId: string | null;
  assignedTeacherName: string | null;
  labels: Pick<
    Dictionary["dashboard"]["parent"],
    "contactTeacherTitle" | "contactTeacherUnassigned" | "contactTeacherCta"
  >;
}

/**
 * Quick CTA to deep-link the parent into the messages composer with the
 * `assigned_teacher_id` of the active child preselected (`?to=<id>`).
 */
export function ParentContactTeacherCta({
  locale,
  assignedTeacherId,
  assignedTeacherName,
  labels,
}: ParentContactTeacherCtaProps) {
  const href = assignedTeacherId
    ? `/${locale}/dashboard/parent/messages?to=${encodeURIComponent(assignedTeacherId)}`
    : null;
  const ctaLabel = labels.contactTeacherCta.replace(
    "{teacher}",
    assignedTeacherName ?? "",
  );
  return (
    <section
      aria-label={labels.contactTeacherTitle}
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]"
    >
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.contactTeacherTitle}
      </p>
      {href && assignedTeacherName ? (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)]"
        >
          <MessageSquare aria-hidden className="h-4 w-4" />
          {ctaLabel}
        </Link>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {labels.contactTeacherUnassigned}
        </p>
      )}
    </section>
  );
}
