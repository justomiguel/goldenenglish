import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersScreen } from "@/components/organisms/AdminUsersScreen";
import { loadPaginatedAdminUsers } from "@/lib/dashboard/loadPaginatedAdminUsers";
import { loadAdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import { lockedRoleUsersParams } from "@/lib/dashboard/lockedRoleUsersParams";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
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
  return buildPageMetadata(locale, (d) => d.dashboard.adminNav.students);
}

export default async function AdminStudentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSp = await searchParams;
  const dict = await getDictionary(locale);
  const paginationParams = lockedRoleUsersParams("student", rawSp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  const admin = createAdminClient();
  const [result, roleCounts, peopleStats] = await Promise.all([
    loadPaginatedAdminUsers(admin, dict.common.emptyValue, paginationParams),
    loadAdminUsersListRoleCounts(admin),
    loadAdminPeoplePageStats(admin, "student"),
  ]);

  return (
    <div>
      <AdminPageHeader
        title={dict.dashboard.adminNav.students}
        lead={dict.dashboard.adminNav.tipStudents}
        iconId="students"
        tourAnchor={ADMIN_TOUR_ANCHORS.usersTitle}
      />
      <AdminPeopleStatsRow
        locale={locale}
        labels={dict.admin.home.peopleStats}
        totalLabel={dict.admin.home.peopleStats.totalStudents}
        roleLabel={dict.admin.users.roleOptionStudent}
        iconId="students"
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
          roleFilter="student"
          roleCounts={roleCounts}
          sortKey={paginationParams.sort ?? "name"}
          sortDir={paginationParams.dir ?? "asc"}
          locale={locale}
          currentUserId={currentUserId}
          labels={dict.admin.users}
          tableLabels={dict.admin.table}
          lockRole="student"
        />
      </div>
    </div>
  );
}
