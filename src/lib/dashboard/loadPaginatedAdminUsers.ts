import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUserRow, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";

const PROFILE_COLUMNS = "id, role, first_name, last_name, phone, avatar_url";

const SORT_COLUMN_MAP: Record<SortKey, string> = {
  email: "last_name",
  name: "last_name",
  role: "role",
  phone: "phone",
};

export interface PaginatedAdminUsersResult {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PaginatedAdminUsersParams {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  sort?: SortKey;
  dir?: "asc" | "desc";
}

function buildSearchFilter(q: string): string {
  const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;
  return [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `phone.ilike.${pattern}`,
  ].join(",");
}

export async function loadPaginatedAdminUsers(
  adminClient: SupabaseClient,
  emptyValue: string,
  params: PaginatedAdminUsersParams = {},
): Promise<PaginatedAdminUsersResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sortCol = SORT_COLUMN_MAP[params.sort ?? "name"] ?? "last_name";
  const ascending = (params.dir ?? "asc") === "asc";
  const q = (params.q ?? "").trim().toLowerCase();
  const roleFilter = params.role ?? ROLE_FILTER_ALL;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = adminClient
    .from("profiles")
    .select(PROFILE_COLUMNS);

  let countQuery = adminClient
    .from("profiles")
    .select("id", { head: true, count: "exact" });

  if (roleFilter !== ROLE_FILTER_ALL) {
    dataQuery = dataQuery.eq("role", roleFilter);
    countQuery = countQuery.eq("role", roleFilter);
  }

  if (q) {
    const filter = buildSearchFilter(q);
    dataQuery = dataQuery.or(filter);
    countQuery = countQuery.or(filter);
  }

  dataQuery = dataQuery
    .order(sortCol, { ascending })
    .range(from, to);

  const [dataResult, countResult] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  const profiles = dataResult.data ?? [];
  const profileIds = profiles.map((p) => p.id as string);

  const emailById = new Map<string, string>();
  await Promise.all(
    profileIds.map(async (id) => {
      const { data } = await adminClient.auth.admin.getUserById(id);
      if (data?.user?.email) {
        emailById.set(id, data.user.email);
      }
    }),
  );

  const sectionSet = await loadActiveEnrollmentSet(adminClient, profileIds);

  const rows: AdminUserRow[] = await Promise.all(
    profiles.map(async (p) => {
      const id = p.id as string;
      const role = (p.role as string) ?? emptyValue;
      const avatarDisplayUrl = await resolveAvatarUrlForAdmin(
        adminClient,
        p.avatar_url as string | null,
      );
      return {
        id,
        email: emailById.get(id) ?? emptyValue,
        firstName: (p.first_name as string) ?? emptyValue,
        lastName: (p.last_name as string) ?? emptyValue,
        role,
        phone: (p.phone as string)?.trim() || emptyValue,
        avatarDisplayUrl,
        missingSection:
          role.toLowerCase() === "student" && !sectionSet.has(id),
      };
    }),
  );

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}

async function loadActiveEnrollmentSet(
  admin: SupabaseClient,
  studentIds: string[],
): Promise<Set<string>> {
  const ids = studentIds.filter((id) => id.trim().length > 0);
  if (ids.length === 0) return new Set();

  const { data } = await admin
    .from("section_enrollments")
    .select("student_id")
    .in("student_id", ids)
    .eq("status", "active");

  return new Set(
    (data ?? []).map((r) => String((r as { student_id: string }).student_id)),
  );
}
