import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersScreen } from "@/components/organisms/AdminUsersScreen";
import {
  loadPaginatedAdminUsers,
  type PaginatedAdminUsersParams,
} from "@/lib/dashboard/loadPaginatedAdminUsers";
import { loadAdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import type { SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminPeopleStatsRow } from "@/components/dashboard/AdminPeopleStatsRow";
import { loadAdminPeoplePageStats } from "@/lib/dashboard/loadAdminPeoplePageStats";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_SORT_KEYS: SortKey[] = [
  "email",
  "name",
  "role",
  "phone",
  "lastAccess",
  "sections",
  "monthlyDue",
  "parent",
  "children",
];

function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PaginatedAdminUsersParams {
  const pageStr = typeof raw.page === "string" ? raw.page : "1";
  const q = typeof raw.q === "string" ? raw.q : "";
  const role = typeof raw.role === "string" ? raw.role : undefined;
  const sort =
    typeof raw.sort === "string" && VALID_SORT_KEYS.includes(raw.sort as SortKey)
      ? (raw.sort as SortKey)
      : "name";
  const dir = raw.dir === "desc" ? "desc" : "asc";

  return {
    page: Math.max(1, parseInt(pageStr, 10) || 1),
    q,
    role,
    sort,
    dir,
  };
}

export default async function AdminUsersListPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const rawSp = await searchParams;
  const dict = await getDictionary(locale);
  const paginationParams = parseSearchParams(rawSp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  const admin = createAdminClient();
  const [result, roleCounts, peopleStats] = await Promise.all([
    loadPaginatedAdminUsers(admin, dict.common.emptyValue, paginationParams),
    loadAdminUsersListRoleCounts(admin),
    loadAdminPeoplePageStats(admin, "all"),
  ]);

  return (
    <div>
      <AdminPageHeader
        title={dict.admin.users.listTitle}
        lead={dict.admin.users.listLead}
        iconId="allAccounts"
        tourAnchor={ADMIN_TOUR_ANCHORS.usersTitle}
      />
      <AdminPeopleStatsRow
        locale={locale}
        labels={dict.admin.home.peopleStats}
        totalLabel={dict.admin.home.peopleStats.totalAccounts}
        roleLabel={dict.admin.users.listTitle}
        iconId="allAccounts"
        total={peopleStats.total}
        allAccounts={peopleStats.allAccounts}
        withPhone={peopleStats.withPhone}
        newLast30Days={peopleStats.newLast30Days}
      />
      <div className="mt-6">
        <AdminUsersScreen
          rows={result.rows}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          searchQuery={paginationParams.q ?? ""}
          roleFilter={paginationParams.role ?? "all"}
          roleCounts={roleCounts}
          sortKey={paginationParams.sort ?? "name"}
          sortDir={paginationParams.dir ?? "asc"}
          locale={locale}
          currentUserId={currentUserId}
          labels={dict.admin.users}
          tableLabels={dict.admin.table}
        />
      </div>
    </div>
  );
}
