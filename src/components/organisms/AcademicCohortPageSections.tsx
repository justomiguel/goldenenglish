import { AdminSectionCard } from "@/components/molecules/AdminSectionCard";
import { CohortSectionDeleteButton } from "@/components/molecules/CohortSectionDeleteButton";
import { CohortSectionsToolbar } from "@/components/organisms/CohortSectionsToolbar";
import type {
  AdminCohortMoveTarget,
  AdminCohortSectionRow,
} from "@/lib/academics/loadAdminCohortPageData";
import type { AcademicSectionLifecycleDict } from "@/types/academicSectionLifecycle";
import type { Dictionary } from "@/types/i18n";

type CohortPageDict = Dictionary["dashboard"]["academicCohortPage"];

export function AcademicCohortPageSections(props: {
  locale: string;
  cohortId: string;
  dict: CohortPageDict;
  sectionLifecycleDict: AcademicSectionLifecycleDict;
  sectionRows: AdminCohortSectionRow[];
  defaultSectionMaxStudents: number;
  teachers: Array<{ id: string; label: string }>;
  copySourceOptions: Array<{ id: string; label: string }>;
  sourceSectionOptions: Array<{ id: string; name: string }>;
  targetOptions: AdminCohortMoveTarget[];
}) {
  const { dict: d, locale, cohortId, sectionRows } = props;
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{d.sectionsTitle}</h2>
        <CohortSectionsToolbar
          locale={locale}
          cohortId={cohortId}
          newSectionButton={d.newSectionButton}
          newSectionButtonTip={d.newSectionButtonTip}
          newSectionModalDict={d.newSectionModal}
          defaultSectionMaxStudents={props.defaultSectionMaxStudents}
          teachers={props.teachers}
          copySectionsButton={d.copySectionsButton}
          copySectionsButtonTip={d.copySectionsButtonTip}
          copySectionsModalDict={d.copySectionsModal}
          copySectionsSourceOptions={props.copySourceOptions}
          rollover={{
            dict: d.rollover,
            sourceSectionOptions: props.sourceSectionOptions,
            targetSectionOptions: props.targetOptions,
          }}
        />
      </div>

      {sectionRows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectionRows.map((row) => (
            <AdminSectionCard
              key={row.id}
              href={`/${locale}/dashboard/admin/academic/${cohortId}/${row.id}`}
              name={row.name}
              activeCount={row.active}
              maxStudents={row.max}
              capacityLabel={d.capacityLabel}
              archivedLabel={row.archivedAt ? d.sectionArchivedBadge : undefined}
              periodLine={row.periodLine}
              imageUrl={row.referenceImageUrl}
              actions={
                <CohortSectionDeleteButton
                  locale={locale}
                  sectionId={row.id}
                  sectionName={row.name}
                  dict={props.sectionLifecycleDict}
                />
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
