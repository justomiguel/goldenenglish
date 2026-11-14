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

export interface AcademicCohortWorkspaceProps {
  locale: string;
  cohortId: string;
  retentionPage: number;
  defaultTab: AcademicCohortDetailTabId;
}

export async function AcademicCohortWorkspace({
  locale,
  cohortId,
  retentionPage,
  defaultTab,
}: AcademicCohortWorkspaceProps) {
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicCohortPage;
  const supabase = await createClient();
  const { data: cohort, error } = await supabase
    .from("academic_cohorts")
    .select(
      "id, name, is_current, archived_at, default_enrollment_fee_amount, default_monthly_fee, enrollment_fee_mode, offers_trial, trial_fee_amount",
    )
    .eq("id", cohortId)
    .maybeSingle();
  if (error || !cohort) return null;

  const [data, feeSectionsResult] = await Promise.all([
    loadAdminCohortPageData(supabase, cohortId, locale),
    supabase
      .from("academic_sections")
      .select("enrollment_fee_amount")
      .eq("cohort_id", cohortId)
      .is("archived_at", null),
  ]);
  const cohortArchivedAt = (cohort as { archived_at?: string | null }).archived_at ?? null;
  const isCurrent = Boolean((cohort as { is_current?: boolean }).is_current);

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
    /* The admin layout already blocks other roles. */
  }

  const initialEnrollment = parseOptionalFeeAmount(
    (cohort as { default_enrollment_fee_amount?: unknown }).default_enrollment_fee_amount,
  );
  const initialMonthly = parseOptionalFeeAmount(
    (cohort as { default_monthly_fee?: unknown }).default_monthly_fee,
  );
  const initialTrialFeeAmount =
    parseOptionalFeeAmount((cohort as { trial_fee_amount?: unknown }).trial_fee_amount) ?? 0;
  const tn = dict.dashboard.academics.transferNotifications;
  const notificationDict: AcademicTransferNotificationDict = {
    emailSubject: tn.emailSubject,
    emailLead: tn.emailLead,
    inAppTitle: tn.inAppTitle,
    inAppBody: tn.inAppBody,
  };
  const brand = await getBrandForRequest();

  return (
    <AcademicCohortDetailShell
      defaultTab={defaultTab}
      labels={d.shellTabs}
      overview={
        <AcademicCohortOverviewTab
          locale={locale}
          cohortId={cohortId}
          cohortArchivedAt={cohortArchivedAt}
          isCurrent={isCurrent}
          distinctActiveStudents={data.distinctActiveStudents}
          sectionCount={data.sectionRows.length}
          initialEnrollment={initialEnrollment}
          initialMonthly={initialMonthly}
          initialMode={cohortEnrollmentFeeModeFromRow(
            (cohort as { enrollment_fee_mode?: string }).enrollment_fee_mode,
          )}
          canUseOnceForAll={canCohortSaveOnceForAll({
            sectionEnrollmentAmounts: (feeSectionsResult.data ?? []).map(
              (row) => (row as { enrollment_fee_amount?: unknown }).enrollment_fee_amount,
            ),
            cohortDefault: (cohort as { default_enrollment_fee_amount?: unknown })
              .default_enrollment_fee_amount,
          })}
          initialOffersTrial={(cohort as { offers_trial?: boolean }).offers_trial === true}
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
          sectionRows={data.sectionRows}
          defaultSectionMaxStudents={data.defaultSectionMaxStudents}
          teachers={data.teachers}
          copySourceOptions={data.copySourceOptions}
          sourceSectionOptions={data.sourceSectionOptions}
          targetOptions={data.targetOptions}
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
  );
}
