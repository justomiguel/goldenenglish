import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminRegistrationsScreen } from "@/components/organisms/AdminRegistrationsScreen";
import {
  loadCohortSections,
  loadCurrentCohort,
} from "@/lib/academics/currentCohort";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";
import { parseRegistrationsListSearchParams } from "@/lib/dashboard/parseRegistrationsListSearchParams";
import {
  loadRegistrationEnrolledCount,
  loadRegistrationStatusCounts,
} from "@/lib/dashboard/loadRegistrationStatusCounts";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminRegistrationsConfigPanel } from "@/components/dashboard/AdminRegistrationsConfigPanel";
import { AdminRegistrationsTabs } from "@/components/dashboard/AdminRegistrationsTabs";
import { AdminRegistrationCreateButton } from "@/components/dashboard/AdminRegistrationCreateButton";
import { AdminRegistrationsCohortStats } from "@/components/dashboard/AdminRegistrationsCohortStats";
import {
  loadRegistrationSectionPickerOptions,
  loadRegistrationSectionPickerOptionsByCohort,
} from "@/lib/register/loadRegistrationSectionPickerOptions";
import { loadRegistrationCohortConfig } from "@/lib/settings/inscriptionsServer";
import { resolveActiveRegistrationExtrasPack } from "@/lib/register/packs/resolveActiveRegistrationExtrasPack";
import { registrationUsesCefrLevel } from "@/lib/register/packs/registrationUsesCefrLevel";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { loadRegistrationInboxCounts } from "@/lib/dashboard/loadRegistrationInboxCounts";
import { visibleRegistrationInboxFilter } from "@/lib/register/registrationFunnelStage";
import { resolveRegistrationCohortId } from "@/lib/register/registrationCohortMembership";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveExistingStudentIdsForLeads } from "@/lib/register/resolveExistingStudentIdsForLeads";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveWhatsAppCountry } from "@/lib/whatsapp/resolveWhatsAppDigits";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { parseRegistrationsPageTab } from "@/lib/register/parseRegistrationsPageTab";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.registrations.title);
}

export default async function AdminRegistrationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSp = await searchParams;
  const dict = await getDictionary(locale);
  const tab = parseRegistrationsPageTab(typeof rawSp.tab === "string" ? rawSp.tab : undefined);
  const tabLabels = {
    list: dict.admin.registrations.pageTabList,
    config: dict.admin.registrations.pageTabConfig,
    aria: dict.admin.registrations.pageTabsAria,
  };
  if (tab === "config") {
    return (
      <div>
        <AdminPageHeader
          title={dict.admin.registrations.title}
          lead={dict.admin.registrations.lead}
          iconId="registrations"
          tourAnchor={ADMIN_TOUR_ANCHORS.registrationsTitle}
        />
        <AdminRegistrationsTabs labels={tabLabels}>
          <AdminRegistrationsConfigPanel locale={locale} labels={dict.admin.settings} />
        </AdminRegistrationsTabs>
      </div>
    );
  }
  const paginationParams = parseRegistrationsListSearchParams(rawSp);
  const supabase = await createClient();
  const cohortConfig = await loadRegistrationCohortConfig();
  const openCohortId = cohortConfig.activeCohort?.id ?? null;
  const selectedCohortId = resolveRegistrationCohortId(
    typeof rawSp.cohort === "string" ? rawSp.cohort : undefined,
    cohortConfig.cohorts,
    openCohortId,
  );
  const cohortHasMatricula =
    (cohortConfig.cohorts.find((item) => item.id === selectedCohortId)?.enrollmentFeeAmount ?? 0) > 0;
  paginationParams.inbox = visibleRegistrationInboxFilter(
    paginationParams.inbox ?? "registered",
    cohortHasMatricula,
  );
  if (selectedCohortId && openCohortId) {
    paginationParams.cohortId = selectedCohortId;
    paginationParams.openCohortId = openCohortId;
  }

  const listQuery = paginationParams.q ?? "";
  const listCountsPromise = loadRegistrationStatusCounts(supabase, listQuery);
  const headerCountsPromise =
    listQuery.trim() === "" ? listCountsPromise : loadRegistrationStatusCounts(supabase, "");

  const [result, legalAgeMajority, cohort, statusCounts, headerCounts, enrolledCount, inboxLoad, brand, sectionOptions, profile] =
    await Promise.all([
      loadPaginatedRegistrations(supabase, paginationParams),
      Promise.resolve(getLegalAgeMajorityFromSystem()),
      loadCurrentCohort(supabase),
      listCountsPromise,
      headerCountsPromise,
      loadRegistrationEnrolledCount(supabase),
      loadRegistrationInboxCounts(
        supabase,
        selectedCohortId && openCohortId
          ? { selectedCohortId, openCohortId }
          : undefined,
      ),
      getBrandForRequest(),
      loadRegistrationSectionPickerOptions(),
      loadActiveTheme().then(async (snapshot) => {
        const kind = snapshot?.theme.templateKind ?? "classic";
        return {
          extrasPack: await resolveActiveRegistrationExtrasPack(),
          usesCefrLevel: registrationUsesCefrLevel(kind),
        };
      }),
    ]);
  const sectionOptionsByCohort = await loadRegistrationSectionPickerOptionsByCohort(
    cohortConfig.cohorts.map((item) => item.id),
  );
  const extrasPack = profile.extrasPack;
  const inboxCounts = inboxLoad.inbox;
  const registrationLabels = profile.usesCefrLevel
    ? dict.admin.registrations
    : {
        ...dict.admin.registrations,
        level: dict.admin.registrations.sectionColumn,
        filterPlaceholder: dict.admin.registrations.filterPlaceholderSection,
        filterTooltip: dict.admin.registrations.filterTooltipSection,
      };
  const existingByLead = await resolveExistingStudentIdsForLeads(
    await createAdminClient(),
    result.rows,
  );
  const rows = result.rows.map((row) => ({
    ...row,
    existingStudentId: existingByLead.get(row.id) ?? null,
  }));

  const inscriptionsCohort = cohortConfig.activeCohort;
  const cohortSections = inscriptionsCohort
    ? await loadCohortSections(supabase, inscriptionsCohort.id)
    : [];
  const createSectionHref = inscriptionsCohort
    ? `/${locale}/dashboard/admin/academic/${inscriptionsCohort.id}?tab=sections`
    : null;

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.registrations.title}
        lead={dict.admin.registrations.lead}
        iconId="registrations"
        tourAnchor={ADMIN_TOUR_ANCHORS.registrationsTitle}
        actions={
          <AdminRegistrationCreateButton
            locale={locale}
            labels={dict.admin.registrations}
            registerDict={dict.register}
            legalAgeMajority={legalAgeMajority}
            sectionOptions={sectionOptions}
            extrasPack={extrasPack}
            cohorts={cohortConfig.cohorts}
            defaultCohortId={cohortConfig.activeCohort?.id ?? cohort?.id ?? null}
            sectionOptionsByCohort={sectionOptionsByCohort}
          />
        }
      />
      <AdminRegistrationsTabs labels={tabLabels}>
      <AdminRegistrationsCohortStats
        locale={locale}
        statsLabels={dict.admin.registrations.stats}
        cohortLabel={dict.admin.registrations.funnel.cohortLabel}
        scoped={Boolean(selectedCohortId && openCohortId)}
        cards={inboxLoad.cards}
        headerCounts={headerCounts}
        enrolledCount={enrolledCount}
        cohorts={cohortConfig.cohorts}
        selectedCohortId={selectedCohortId}
      />
      <div className="mt-3 md:mt-6">
        <AdminRegistrationsScreen
          locale={locale}
          rows={rows}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          searchQuery={paginationParams.q ?? ""}
          sortKey={paginationParams.sort ?? "received"}
          sortDir={paginationParams.dir ?? "desc"}
          statusFilter={paginationParams.status}
          statusCounts={statusCounts}
          inboxFilter={paginationParams.inbox}
          inboxCounts={inboxCounts}
          legalAgeMajority={legalAgeMajority}
          instituteName={brand.name}
          instituteCountry={resolveWhatsAppCountry(brand.contactPhone)}
          labels={registrationLabels}
          usesCefrLevel={profile.usesCefrLevel}
          tableLabels={dict.admin.table}
          userLabels={{
            password: dict.admin.users.password,
            passwordHint: dict.admin.users.passwordHint,
          }}
          currentCohortSections={cohortSections}
          sectionOptionsByCohort={sectionOptionsByCohort}
          currentCohortName={inscriptionsCohort?.name}
          createSectionHref={createSectionHref}
          selectedCohortId={selectedCohortId}
          cycleStartsOn={cohortConfig.cohorts.find((item) => item.id === selectedCohortId)?.startsOn ?? null}
          cycleEndsOn={cohortConfig.cohorts.find((item) => item.id === selectedCohortId)?.endsOn ?? null}
          openCohortId={openCohortId}
          cohortHasMatricula={cohortHasMatricula}
        />
      </div>
      </AdminRegistrationsTabs>
    </div>
  );
}
