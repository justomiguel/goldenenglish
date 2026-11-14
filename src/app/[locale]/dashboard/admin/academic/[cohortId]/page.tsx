import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { AcademicCohortWorkspace } from "@/components/organisms/AcademicCohortWorkspace";
import {
  type AcademicCohortDetailTabId,
} from "@/components/organisms/AcademicCohortDetailShell";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { parseRetentionPage } from "@/lib/academics/parseRetentionPage";

const COHORT_TABS: readonly AcademicCohortDetailTabId[] = [
  "overview",
  "sections",
  "retention",
  "transfers",
];

interface PageProps {
  params: Promise<{ locale: string; cohortId: string }>;
  searchParams: Promise<{ tab?: string | string[]; rPage?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicCohortPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicCohortPage({ params, searchParams }: PageProps) {
  const { locale, cohortId } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicCohortPage;
  const supabase = await createClient();
  const { data: cohort, error } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at")
    .eq("id", cohortId)
    .maybeSingle();
  if (error || !cohort) notFound();

  const archivedAt = (cohort as { archived_at?: string | null }).archived_at ?? null;
  const isCurrent = Boolean((cohort as { is_current?: boolean }).is_current);
  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tabParam = typeof rawTab === "string" ? rawTab : "";
  let defaultTab: AcademicCohortDetailTabId = archivedAt != null ? "overview" : "sections";
  if (COHORT_TABS.includes(tabParam as AcademicCohortDetailTabId)) {
    defaultTab = tabParam as AcademicCohortDetailTabId;
  }

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href={`/${locale}/dashboard/admin/academic`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backHub}
        </Link>
        <div className="mt-2">
          <AdminPageHeader
            title={cohort.name as string}
            iconId="academic"
            tourAnchor={ADMIN_TOUR_ANCHORS.cohortDetailTitle}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isCurrent ? (
            <span className="rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              {d.badgeCurrent}
            </span>
          ) : null}
          {archivedAt ? (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
              {d.badgeArchived}
            </span>
          ) : null}
        </div>
      </div>
      <AcademicCohortWorkspace
        locale={locale}
        cohortId={cohortId}
        retentionPage={parseRetentionPage(sp.rPage)}
        defaultTab={defaultTab}
      />
    </div>
  );
}
