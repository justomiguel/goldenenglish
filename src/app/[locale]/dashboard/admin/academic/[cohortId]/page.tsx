import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminCohortPageData } from "@/lib/academics/loadAdminCohortPageData";
import { AdminSectionCard } from "@/components/molecules/AdminSectionCard";
import { CohortSectionsToolbar } from "@/components/organisms/CohortSectionsToolbar";
import { AcademicCohortLifecycleBar } from "@/components/organisms/AcademicCohortLifecycleBar";
import { AcademicCohortDetailShell } from "@/components/organisms/AcademicCohortDetailShell";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicCohortPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicCohortPage({ params }: PageProps) {
  const { locale, cohortId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicCohortPage;
  const supabase = await createClient();

  const { data: cohort, error: cErr } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at")
    .eq("id", cohortId)
    .maybeSingle();

  if (cErr || !cohort) notFound();

  const data = await loadAdminCohortPageData(supabase, cohortId, locale);
  const {
    sectionRows,
    distinctActiveStudents,
    targetOptions,
    sourceSectionOptions,
    teachers,
    copySourceOptions,
    defaultSectionMaxStudents: defMax,
  } = data;

  const cohortArchivedAt = (cohort as { archived_at?: string | null }).archived_at ?? null;
  const isCurrent = Boolean((cohort as { is_current?: boolean }).is_current);
  const defaultTab =
    cohortArchivedAt != null ? "overview" : sectionRows.length > 0 ? "sections" : "overview";

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href={`/${locale}/dashboard/admin/academic`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backHub}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{cohort.name as string}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isCurrent ? (
            <span className="rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              {d.badgeCurrent}
            </span>
          ) : null}
          {cohortArchivedAt ? (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
              {d.badgeArchived}
            </span>
          ) : null}
        </div>
      </div>

      <AcademicCohortDetailShell
        defaultTab={defaultTab}
        labels={d.shellTabs}
        overview={
          <>
            <AcademicCohortLifecycleBar
              locale={locale}
              cohortId={cohortId}
              cohortArchivedAt={cohortArchivedAt}
              isCurrent={isCurrent}
              dict={d.lifecycle}
            />
            <section className="grid gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {d.kpiStudents}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{distinctActiveStudents}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {d.kpiSections}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{sectionRows.length}</p>
              </div>
            </section>
          </>
        }
        sections={
          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-primary)]">{d.sectionsTitle}</h2>
              <CohortSectionsToolbar
                locale={locale}
                cohortId={cohortId}
                newSectionButton={d.newSectionButton}
                newSectionButtonTip={d.newSectionButtonTip}
                newSectionModalDict={d.newSectionModal}
                defaultSectionMaxStudents={defMax}
                teachers={teachers}
                copySectionsButton={d.copySectionsButton}
                copySectionsButtonTip={d.copySectionsButtonTip}
                copySectionsModalDict={d.copySectionsModal}
                copySectionsSourceOptions={copySourceOptions}
                rollover={{
                  dict: d.rollover,
                  sourceSectionOptions,
                  targetSectionOptions: targetOptions,
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
                  />
                ))}
              </div>
            )}
          </section>
        }
      />
    </div>
  );
}
