import Link from "next/link";
import { AcademicSectionLifecycleActions } from "@/components/organisms/AcademicSectionLifecycleActions";
import { AcademicSectionLifecycleStatus } from "@/components/organisms/AcademicSectionLifecycleStatus";
import { AcademicSectionNameEditor } from "@/components/organisms/AcademicSectionNameEditor";
import type { Dictionary } from "@/types/i18n";
import { SectionReferenceThumb } from "@/components/molecules/SectionReferenceThumb";

type LifecycleDict = Dictionary["dashboard"]["academicSectionPage"]["lifecycle"];
type NameEditorDict = Dictionary["dashboard"]["academicSectionPage"]["nameEditor"];

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
  nameEditorDict,
  imageUrl,
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
  nameEditorDict: NameEditorDict;
  imageUrl?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-border))] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-primary)_8%,#eef3fb)_0%,color-mix(in_srgb,var(--color-primary)_12%,#e8eef8)_48%,color-mix(in_srgb,var(--color-primary)_6%,#f5f7fb)_100%)] px-6 py-6 shadow-[var(--shadow-soft)]">
      <Link
        href={`/${locale}/dashboard/admin/academic/${cohortId}`}
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {backCohortLabel}
      </Link>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <SectionReferenceThumb src={imageUrl} alt={sectionName} size="md" />
          <div className="min-w-0 flex-1 space-y-1">
            <AcademicSectionNameEditor
              variant="inline"
              locale={locale}
              sectionId={sectionId}
              initialName={sectionName}
              dict={nameEditorDict}
            />
            <p className="text-sm font-medium text-[var(--color-primary)]">{cohortName}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">{sectionLead}</p>
            <AcademicSectionLifecycleStatus
              sectionArchivedAt={sectionArchivedAt}
              cohortArchivedAt={cohortArchivedAt}
              dict={lifecycleDict}
            />
          </div>
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
