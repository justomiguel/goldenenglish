import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { loadAdminCohortPageData } from "@/lib/academics/loadAdminCohortPageData";
import { loadAdminRetentionCandidates } from "@/lib/academics/loadAdminRetentionCandidates";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { loadAdminTransferInboxRows } from "@/lib/academics/loadAdminTransferInboxRows";
import { AcademicCohortOverviewTab } from "@/components/organisms/AcademicCohortOverviewTab";
import { AcademicCohortPageSections } from "@/components/organisms/AcademicCohortPageSections";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import {
  canCohortSaveOnceForAll,
  cohortEnrollmentFeeModeFromRow,
} from "@/lib/academics/cohortEnrollmentFeeModeProps";
import {
  AcademicCohortDetailShell,
  type AcademicCohortDetailTabId,
} from "@/components/organisms/AcademicCohortDetailShell";
import { AdminRetentionTable } from "@/components/organisms/AdminRetentionTable";
import { AcademicTransferInboxTable } from "@/components/organisms/AcademicTransferInboxTable";
import type { AcademicTransferNotificationDict } from "@/app/[locale]/dashboard/admin/academic/transferActions";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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
  const rPageRaw = Array.isArray(sp.rPage) ? sp.rPage[0] : sp.rPage;
  const parsedR = parseInt(String(rPageRaw ?? "1"), 10);
  const retentionPage = Number.isFinite(parsedR) && parsedR > 0 ? Math.min(10_000, parsedR) : 1;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicCohortPage;
  const supabase = await createClient();

  const { data: cohort, error: cErr } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at, default_enrollment_fee_amount, default_monthly_fee, enrollment_fee_mode, offers_trial, trial_fee_amount")
    .eq("id", cohortId)
    .maybeSingle();

  if (cErr || !cohort) notFound();

  const [data, feeSectionsResult] = await Promise.all([
    loadAdminCohortPageData(supabase, cohortId, locale),
    supabase
      .from("academic_sections")
      .select("enrollment_fee_amount")
      .eq("cohort_id", cohortId)
      .is("archived_at", null),
  ]);
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

  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tabParam = typeof rawTab === "string" ? rawTab : "";
  let defaultTab: AcademicCohortDetailTabId =
    cohortArchivedAt != null ? "overview" : sectionRows.length > 0 ? "sections" : "overview";
  if (COHORT_TABS.includes(tabParam as AcademicCohortDetailTabId)) {
    defaultTab = tabParam as AcademicCohortDetailTabId;
  }

  let retentionRows: Awaited<ReturnType<typeof loadAdminRetentionCandidates>>["rows"] = [];
  let retentionTotal = 0;
  let transferRows: Awaited<ReturnType<typeof loadAdminTransferInboxRows>> = [];
  try {
    const { supabase: adm } = await assertAdmin();
    const [retention, transfers] = await Promise.all([
      loadAdminRetentionCandidates(adm, {
        cohortId,
        page: retentionPage,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
      }),
      loadAdminTransferInboxRows(adm, locale, { cohortId }),
    ]);
    retentionRows = retention.rows;
    retentionTotal = retention.total;
    transferRows = transfers;
  } catch {
    /* admin layout should prevent; leave empty */
  }

  const initialEnrollment = parseOptionalFeeAmount(
    (cohort as { default_enrollment_fee_amount?: unknown }).default_enrollment_fee_amount,
  );
  const initialMonthly = parseOptionalFeeAmount(
    (cohort as { default_monthly_fee?: unknown }).default_monthly_fee,
  );
  const initialMode = cohortEnrollmentFeeModeFromRow(
    (cohort as { enrollment_fee_mode?: string }).enrollment_fee_mode,
  );
  const canUseOnceForAll = canCohortSaveOnceForAll({
    sectionEnrollmentAmounts: (feeSectionsResult.data ?? []).map(
      (row) => (row as { enrollment_fee_amount?: unknown }).enrollment_fee_amount,
    ),
    cohortDefault: (cohort as { default_enrollment_fee_amount?: unknown })
      .default_enrollment_fee_amount,
  });
  const initialOffersTrial = (cohort as { offers_trial?: boolean }).offers_trial === true;
  const initialTrialFeeAmount = parseOptionalFeeAmount(
    (cohort as { trial_fee_amount?: unknown }).trial_fee_amount,
  ) ?? 0;

  const brand = await getBrandForRequest();
  const tn = dict.dashboard.academics.transferNotifications;
  const notificationDict: AcademicTransferNotificationDict = {
    emailSubject: tn.emailSubject,
    emailLead: tn.emailLead,
    inAppTitle: tn.inAppTitle,
    inAppBody: tn.inAppBody,
  };

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
          <AcademicCohortOverviewTab
            locale={locale}
            cohortId={cohortId}
            cohortArchivedAt={cohortArchivedAt}
            isCurrent={isCurrent}
            distinctActiveStudents={distinctActiveStudents}
            sectionCount={sectionRows.length}
            initialEnrollment={initialEnrollment}
            initialMonthly={initialMonthly}
            initialMode={initialMode}
            canUseOnceForAll={canUseOnceForAll}
            initialOffersTrial={initialOffersTrial}
            initialTrialFeeAmount={initialTrialFeeAmount}
            dict={d}
          />
        }
        sections={
          <AcademicCohortPageSections
            locale={locale}
            cohortId={cohortId}
            dict={d}
            sectionLifecycleDict={dict.dashboard.academicSectionPage.lifecycle}
            sectionRows={sectionRows}
            defaultSectionMaxStudents={defMax}
            teachers={teachers}
            copySourceOptions={copySourceOptions}
            sourceSectionOptions={sourceSectionOptions}
            targetOptions={targetOptions}
          />
        }
        retention={
          <AdminRetentionTable
            locale={locale}
            cohortId={cohortId}
            brandAppName={brand.name}
            rows={retentionRows}
            dict={dict.dashboard.adminRetention}
            retentionPage={retentionPage}
            retentionPageSize={DEFAULT_TABLE_PAGE_SIZE}
            retentionTotal={retentionTotal}
            paginationLabels={dict.admin.table}
          />
        }
        transferInbox={
          <AcademicTransferInboxTable
            locale={locale}
            rows={transferRows}
            dict={dict.dashboard.academicRequests}
            notificationDict={notificationDict}
          />
        }
      />
    </div>
  );
}
