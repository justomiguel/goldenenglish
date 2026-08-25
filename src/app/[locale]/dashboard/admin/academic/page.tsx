import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { AcademicHubCohortBoard } from "@/components/organisms/AcademicHubCohortBoard";
import type { AcademicHubCohortSummary } from "@/components/molecules/AcademicHubCohortRow";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.academicHub.title);
}

export default async function AcademicHubPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicHub;
  const supabase = await createClient();

  const { data: cohorts } = await supabase
    .from("academic_cohorts")
    .select("id, name, slug, is_current, archived_at, created_at")
    .order("created_at", { ascending: false });

  const list: AcademicHubCohortSummary[] = (cohorts ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    is_current: Boolean(c.is_current),
    archived_at: (c as { archived_at?: string | null }).archived_at ?? null,
  }));

  const currentCohort = list.find((c) => c.is_current) ?? null;
  const archivedList = list.filter((c) => !c.is_current && c.archived_at != null);
  const activeList = list.filter((c) => !c.is_current && c.archived_at == null);

  const rowLabels = {
    currentBadge: d.table.currentBadge,
    statusActive: d.table.statusActive,
    setAsCurrent: d.table.setAsCurrent,
    open: d.table.open,
    archivedBadge: d.table.archivedBadge,
    openCohortTitle: d.table.openCohortTitle,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={d.title}
        lead={d.lead}
        iconId="academic"
        tourAnchor={ADMIN_TOUR_ANCHORS.academicTitle}
        actions={<AcademicHubToolbar locale={locale} dict={d.toolbar} />}
      />

      <AcademicHubCohortBoard
        locale={locale}
        current={currentCohort}
        active={activeList}
        archived={archivedList}
        boardDict={d.board}
        rowLabels={rowLabels}
        hasAnyCohort={list.length > 0}
      />
    </div>
  );
}
