import Link from "next/link";
import { AcademicSectionLifecycleActions } from "@/components/organisms/AcademicSectionLifecycleActions";
import { AcademicSectionLifecycleStatus } from "@/components/organisms/AcademicSectionLifecycleStatus";
import type { Dictionary } from "@/types/i18n";

type LifecycleDict = Dictionary["dashboard"]["academicSectionPage"]["lifecycle"];

export function AcademicSectionPageHeader({
  locale,
  cohortId,
  sectionId,
  sectionName,
  cohortName,
  sectionArchivedAt,
  cohortArchivedAt,
  backCohortLabel,
  sectionLead,
  lifecycleDict,
}: {
  locale: string;
  cohortId: string;
  sectionId: string;
  sectionName: string;
  cohortName: string;
  sectionArchivedAt: string | null;
  cohortArchivedAt: string | null;
  backCohortLabel: string;
  sectionLead: string;
  lifecycleDict: LifecycleDict;
}) {
  return (
    <div className="min-w-0 border-b border-[var(--color-border)] pb-4">
      <Link
        href={`/${locale}/dashboard/admin/academic/${cohortId}`}
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {backCohortLabel}
      </Link>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{sectionName}</h1>
          <p className="text-sm font-medium text-[var(--color-primary)]">{cohortName}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{sectionLead}</p>
          <AcademicSectionLifecycleStatus
            sectionArchivedAt={sectionArchivedAt}
            cohortArchivedAt={cohortArchivedAt}
            dict={lifecycleDict}
          />
        </div>
        <div className="flex shrink-0 flex-wrap justify-end sm:pt-0.5">
          <AcademicSectionLifecycleActions
            locale={locale}
            sectionId={sectionId}
            sectionArchivedAt={sectionArchivedAt}
            cohortArchivedAt={cohortArchivedAt}
            dict={lifecycleDict}
          />
        </div>
      </div>
    </div>
  );
}
