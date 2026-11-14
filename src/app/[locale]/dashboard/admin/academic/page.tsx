import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { AcademicHubCohortSelect } from "@/components/molecules/AcademicHubCohortSelect";
import { AcademicCohortWorkspace } from "@/components/organisms/AcademicCohortWorkspace";
import { parseRetentionPage } from "@/lib/academics/parseRetentionPage";
import {
  orderHubCohorts,
  resolveHubCohortId,
  type HubCohortOption,
} from "@/lib/academics/resolveHubCohortSelection";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cohort?: string | string[]; rPage?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.academicHub.title);
}

export default async function AcademicHubPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const queryId = Array.isArray(sp.cohort) ? sp.cohort[0] : sp.cohort;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicHub;
  const supabase = await createClient();

  const { data: cohorts } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at")
    .order("created_at", { ascending: false });

  const options: HubCohortOption[] = orderHubCohorts(
    (cohorts ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      isCurrent: Boolean(c.is_current),
      archivedAt: (c as { archived_at?: string | null }).archived_at ?? null,
    })),
  );
  const selectedId = resolveHubCohortId(options, queryId);
  const workspace = selectedId
    ? await AcademicCohortWorkspace({
        locale,
        cohortId: selectedId,
        retentionPage: parseRetentionPage(sp.rPage),
        defaultTab: "sections",
      })
    : null;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={d.title}
        lead={d.lead}
        iconId="academic"
        tourAnchor={ADMIN_TOUR_ANCHORS.academicTitle}
        actions={
          <AcademicHubToolbar
            locale={locale}
            sourceCohorts={options
              .filter((c) => c.archivedAt == null)
              .map((c) => ({ id: c.id, name: c.name }))}
            dict={d.toolbar}
          />
        }
      />

      <AcademicHubCohortSelect
        label={d.cohortSelectLabel}
        placeholder={d.cohortSelectPlaceholder}
        currentMark={d.table.currentBadge}
        archivedMark={d.table.archivedBadge}
        options={options}
        selectedId={selectedId}
      />

      {workspace ? (
        <div data-tour={ADMIN_TOUR_ANCHORS.academicCohortList}>{workspace}</div>
      ) : (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {d.emptyPickCohort}
        </p>
      )}
    </div>
  );
}
