import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminRegistrationsScreen } from "@/components/organisms/AdminRegistrationsScreen";
import {
  loadCurrentCohort,
  loadCurrentCohortSections,
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
import { AdminRegistrationCreateButton } from "@/components/dashboard/AdminRegistrationCreateButton";
import { AdminRegistrationsStatsRow } from "@/components/dashboard/AdminRegistrationsStatsRow";
import { loadRegistrationSectionPickerOptions } from "@/lib/register/loadRegistrationSectionPickerOptions";
import { extrasPackForTemplateKind } from "@/lib/register/packs/extrasPackForTemplateKind";
import { registrationUsesCefrLevel } from "@/lib/register/packs/registrationUsesCefrLevel";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { loadRegistrationInboxCounts } from "@/lib/dashboard/loadRegistrationInboxCounts";
import { parseRegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveExistingStudentIdsForLeads } from "@/lib/register/resolveExistingStudentIdsForLeads";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveWhatsAppCountry } from "@/lib/whatsapp/resolveWhatsAppDigits";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

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
  const paginationParams = parseSearchParams(rawSp);

  const supabase = await createClient();
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
      loadRegistrationInboxCounts(supabase),
      getBrandForRequest(),
      loadRegistrationSectionPickerOptions(),
      loadActiveTheme().then((snapshot) => {
        const kind = snapshot?.theme.templateKind ?? "classic";
        return {
          extrasPack: extrasPackForTemplateKind(kind),
          usesCefrLevel: registrationUsesCefrLevel(kind),
        };
      }),
    ]);
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

  const cohortSections = cohort
    ? await loadCurrentCohortSections(supabase)
    : [];

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
          />
        }
      />
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
          currentCohortName={cohort?.name}
        />
      </div>
    </div>
  );
}
