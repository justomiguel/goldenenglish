import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminRegistrationsScreen } from "@/components/organisms/AdminRegistrationsScreen";
import {
  loadCohortSections,
  loadCurrentCohort,
} from "@/lib/academics/currentCohort";
import {
  loadPaginatedRegistrations,
  type PaginatedRegistrationsParams,
} from "@/lib/dashboard/loadPaginatedRegistrations";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import {
  loadRegistrationEnrolledCount,
  loadRegistrationStatusCounts,
} from "@/lib/dashboard/loadRegistrationStatusCounts";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminRegistrationsConfigPanel } from "@/components/dashboard/AdminRegistrationsConfigPanel";
import { AdminRegistrationsTabs } from "@/components/dashboard/AdminRegistrationsTabs";
import { AdminRegistrationCreateButton } from "@/components/dashboard/AdminRegistrationCreateButton";
import { AdminRegistrationsStatsRow } from "@/components/dashboard/AdminRegistrationsStatsRow";
import {
  loadRegistrationSectionPickerOptions,
  loadRegistrationSectionPickerOptionsByCohort,
} from "@/lib/register/loadRegistrationSectionPickerOptions";
import { loadRegistrationCohortConfig } from "@/lib/settings/inscriptionsServer";
import { resolveActiveRegistrationExtrasPack } from "@/lib/register/packs/resolveActiveRegistrationExtrasPack";
import { registrationUsesCefrLevel } from "@/lib/register/packs/registrationUsesCefrLevel";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { loadRegistrationInboxCounts } from "@/lib/dashboard/loadRegistrationInboxCounts";
import { parseRegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
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

const VALID_SORT_KEYS: RegistrationSortKey[] = [
  "name", "dni", "email", "phoneStudent", "phoneTutor", "level", "birth", "status", "received",
];

function parseSearchParams(raw: Record<string, string | string[] | undefined>): PaginatedRegistrationsParams {
  const pageStr = typeof raw.page === "string" ? raw.page : "1";
  const q = typeof raw.q === "string" ? raw.q : "";
  const sort = typeof raw.sort === "string" && VALID_SORT_KEYS.includes(raw.sort as RegistrationSortKey)
    ? (raw.sort as RegistrationSortKey)
    : "received";
  const dir = raw.dir === "asc" ? "asc" : "desc";
  const status = raw.status === "new" || raw.status === "contacted" ? raw.status : undefined;
  const inboxRaw = typeof raw.inbox === "string" ? raw.inbox : undefined;

  return {
    page: Math.max(1, parseInt(pageStr, 10) || 1),
    q,
    sort,
    dir,
    status,
    inbox: parseRegistrationInboxFilter(inboxRaw, status),
  };
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
  const paginationParams = parseSearchParams(rawSp);
  const supabase = await createClient();
  const cohortConfig = await loadRegistrationCohortConfig();
  const openCohortId = cohortConfig.activeCohort?.id ?? null;
  const selectedCohortId = resolveRegistrationCohortId(
    typeof rawSp.cohort === "string" ? rawSp.cohort : undefined,
    cohortConfig.cohorts,
    openCohortId,
  );
  if (selectedCohortId && openCohortId) {
    paginationParams.cohortId = selectedCohortId;
    paginationParams.openCohortId = openCohortId;
  }

  const listQuery = paginationParams.q ?? "";
  const listCountsPromise = loadRegistrationStatusCounts(supabase, listQuery);
  const headerCountsPromise =
    listQuery.trim() === "" ? listCountsPromise : loadRegistrationStatusCounts(supabase, "");

  const [result, legalAgeMajority, cohort, statusCounts, headerCounts, enrolledCount, inboxCounts, brand, sectionOptions, profile] =
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
      <AdminRegistrationsStatsRow
        locale={locale}
        labels={dict.admin.registrations.stats}
        total={headerCounts.total + enrolledCount}
        pending={headerCounts.new}
        contacted={headerCounts.contacted}
        enrolled={enrolledCount}
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
          cohorts={cohortConfig.cohorts}
          selectedCohortId={selectedCohortId}
          openCohortId={openCohortId}
        />
      </div>
      </AdminRegistrationsTabs>
    </div>
  );
}
