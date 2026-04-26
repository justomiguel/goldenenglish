import type { AcademicSectionLifecycleDict } from "@/types/academicSectionLifecycle";

export interface AcademicSectionLifecycleStatusProps {
  sectionArchivedAt: string | null;
  cohortArchivedAt: string | null;
  dict: Pick<AcademicSectionLifecycleDict, "archivedBanner" | "cohortArchivedHint">;
}

export function AcademicSectionLifecycleStatus({
  sectionArchivedAt,
  cohortArchivedAt,
  dict,
}: AcademicSectionLifecycleStatusProps) {
  const isSectionArchived = sectionArchivedAt != null;
  const cohortArchived = cohortArchivedAt != null;

  if (!isSectionArchived && !cohortArchived) return null;

  return (
    <div className="mt-3 space-y-2">
      {isSectionArchived ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.archivedBanner}</p>
      ) : null}
      {cohortArchived ? <p className="text-sm text-[var(--color-error)]">{dict.cohortArchivedHint}</p> : null}
    </div>
  );
}
