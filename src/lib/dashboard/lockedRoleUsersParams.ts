import type { PaginatedAdminUsersParams } from "@/lib/dashboard/loadPaginatedAdminUsers";
import type { SortKey } from "@/lib/dashboard/adminUsersTableHelpers";

const VALID_SORT_KEYS: SortKey[] = ["email", "name", "role", "phone"];

export function parseAdminUsersSearchParams(
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

export function lockedRoleUsersParams(
  lockedRole: "student" | "teacher",
  raw: Record<string, string | string[] | undefined>,
): PaginatedAdminUsersParams {
  const parsed = parseAdminUsersSearchParams(raw);
  return {
    ...parsed,
    role: lockedRole,
    sort: lockedRole === "student" ? "name" : parsed.sort,
  };
}
