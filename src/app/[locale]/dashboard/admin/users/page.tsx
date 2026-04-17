import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersScreen } from "@/components/organisms/AdminUsersScreen";
import {
  loadPaginatedAdminUsers,
  type PaginatedAdminUsersParams,
} from "@/lib/dashboard/loadPaginatedAdminUsers";
import type { SortKey } from "@/lib/dashboard/adminUsersTableHelpers";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_SORT_KEYS: SortKey[] = ["email", "name", "role", "phone"];

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
  const result = await loadPaginatedAdminUsers(
    admin,
    dict.common.emptyValue,
    paginationParams,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.users.listTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {dict.admin.users.listLead}
      </p>
      <div className="mt-6">
        <AdminUsersScreen
          rows={result.rows}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          searchQuery={paginationParams.q ?? ""}
          roleFilter={paginationParams.role ?? "all"}
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
