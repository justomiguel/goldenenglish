import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminParentsScreen } from "@/components/dashboard/AdminParentsScreen";
import { loadAdminLockedRoleDirectory } from "@/lib/dashboard/loadAdminLockedRoleDirectory";
import { parseAdminDirectoryFilters } from "@/lib/dashboard/adminDirectoryFilters";
import { parentFilterScopeQuery } from "@/lib/parents/parentFilterScopeQuery";
import { parseParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";
import { loadAdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import { lockedRoleUsersParams } from "@/lib/dashboard/lockedRoleUsersParams";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminPeopleStatsRow } from "@/components/dashboard/AdminPeopleStatsRow";
import { loadAdminPeoplePageStats } from "@/lib/dashboard/loadAdminPeoplePageStats";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.adminNav.parents);
}

export default async function AdminParentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSp = await searchParams;
  const dict = await getDictionary(locale);
  const paginationParams = lockedRoleUsersParams("parent", rawSp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  const admin = createAdminClient();
  const [result, roleCounts, peopleStats] = await Promise.all([
    loadAdminLockedRoleDirectory(admin, dict.common.emptyValue, paginationParams),
    loadAdminUsersListRoleCounts(admin),
    loadAdminPeoplePageStats(admin, "parent"),
  ]);
  const directoryValues = parseAdminDirectoryFilters("parent", rawSp);
  const filterScope = parseParentRecipientScope({
    scope: "filter",
    q: paginationParams.q ?? "",
    ...directoryValues,
    access: directoryValues.access ?? "all",
    section: directoryValues.section ?? "",
  });
  const scopeParams =
    filterScope.kind === "filter" ? parentFilterScopeQuery(filterScope) : { scope: "filter" };

  return (
    <div>
      <AdminPageHeader
        title={dict.dashboard.adminNav.parents}
        lead={dict.dashboard.adminNav.tipParents}
        iconId="parents"
      />
      <AdminPeopleStatsRow
        locale={locale}
        labels={dict.admin.home.peopleStats}
        totalLabel={dict.admin.home.peopleStats.totalParents}
        roleLabel={dict.admin.users.roleOptionParent}
        iconId="parents"
        total={peopleStats.total}
        allAccounts={peopleStats.allAccounts}
        withPhone={peopleStats.neverEntered}
        phoneLabel={dict.admin.home.peopleStats.neverEntered}
        newLast30Days={peopleStats.newLast30Days}
      />
      <div className="mt-6">
        <AdminParentsScreen
          rows={result.rows}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          searchQuery={paginationParams.q ?? ""}
          roleFilter="parent"
          roleCounts={roleCounts}
          sortKey={paginationParams.sort ?? "name"}
          sortDir={paginationParams.dir ?? "asc"}
          locale={locale}
          currentUserId={currentUserId}
          labels={dict.admin.users}
          tableLabels={dict.admin.table}
          parentsLabels={dict.admin.parents}
          scopeParams={scopeParams}
          directoryFilters={{
            role: "parent",
            labels: dict.admin.directoryFilters,
            values: directoryValues,
            facets: result.facets,
            sectionOptions: result.sectionOptions,
          }}
        />
      </div>
    </div>
  );
}
