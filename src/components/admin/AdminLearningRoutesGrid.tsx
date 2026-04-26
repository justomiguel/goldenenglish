import Link from "next/link";
import { Globe2, Route } from "lucide-react";
import type { ContentSectionOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRoutesGridProps {
  locale: string;
  sections: ContentSectionOption[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminLearningRoutesGrid({ locale, sections, labels }: AdminLearningRoutesGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Link
        href={`/${locale}/dashboard/admin/academic/contents/sections/global/edit`}
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-muted)]"
      >
        <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
          <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
          {labels.globalRouteOption}
        </span>
        <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{labels.globalRouteLead}</span>
      </Link>
      {sections.map((section) => (
        <Link
          key={section.id}
          href={`/${locale}/dashboard/admin/academic/contents/sections/${section.id}/edit`}
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-muted)]"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
            <Route className="h-4 w-4 shrink-0" aria-hidden />
            {section.label}
          </span>
          <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{section.cohortName}</span>
        </Link>
      ))}
    </section>
  );
}
