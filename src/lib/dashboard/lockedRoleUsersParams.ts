import type { PaginatedAdminUsersParams } from "@/lib/dashboard/loadPaginatedAdminUsers";
import { parseAdminDirectoryFilters } from "@/lib/dashboard/adminDirectoryFilters";
import { parseAdminUsersSortCriteria } from "@/lib/dashboard/adminUsersSortCriteria";
import { parseAcademicDirectoryParams } from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";

export function parseAdminUsersSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PaginatedAdminUsersParams {
  const pageStr = typeof raw.page === "string" ? raw.page : "1";
  const q = typeof raw.q === "string" ? raw.q : "";
  const role = typeof raw.role === "string" ? raw.role : undefined;
  const sortCriteria = parseAdminUsersSortCriteria({
    order: raw.order,
    sort: raw.sort,
    dir: raw.dir,
  });
  const first = sortCriteria[0];

  return {
    page: Math.max(1, parseInt(pageStr, 10) || 1),
    q,
    role,
    sort: first.key,
    dir: first.dir,
    sortCriteria,
  };
}

export function lockedRoleUsersParams(
  lockedRole: "student" | "teacher" | "parent",
  raw: Record<string, string | string[] | undefined>,
): PaginatedAdminUsersParams {
  const parsed = parseAdminUsersSearchParams(raw);
  const filters = parseAdminDirectoryFilters(lockedRole, raw);
  return {
    ...parsed,
    role: lockedRole,
    sort: parsed.sort,
    lockedDirectory: true,
    ...filters,
    academicFieldFilters: lockedRole === "student" ? parseAcademicDirectoryParams(raw) : {},
  };
}
