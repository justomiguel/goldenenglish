import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUserRow, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import type { AdminDirectoryFilters } from "@/lib/dashboard/adminDirectoryFilters";
import {
  isLockedDirectoryRole,
  loadAdminLockedRoleDirectory,
} from "@/lib/dashboard/loadAdminLockedRoleDirectory";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";
import {
  buildAdminUsersProfileOrFilter,
  looksLikeFullEmailQuery,
} from "@/lib/dashboard/buildAdminUsersProfileOrFilter";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS,
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import {
  emptyAdminStudentDirectoryExtras,
  loadAdminStudentDirectoryExtras,
} from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import {
  emptyAdminParentDirectoryExtras,
  loadAdminParentDirectoryExtras,
} from "@/lib/dashboard/loadAdminParentDirectoryExtras";
import { loadParentIdsForActiveSection } from "@/lib/dashboard/loadParentIdsForActiveSection";
import { loadAdminTeacherDirectorySections } from "@/lib/dashboard/loadAdminTeacherDirectorySections";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";

const PROFILE_COLUMNS = "id, role, first_name, last_name, phone, avatar_url, last_session_start_at";

const SORT_COLUMN_MAP: Record<SortKey, string> = {
  email: "last_name",
  name: "last_name",
  role: "role",
  phone: "phone",
  lastAccess: "last_session_start_at",
  sections: "last_name",
  monthlyDue: "last_name",
  parent: "last_name",
  children: "last_name",
  lastEnrollment: "last_name",
  enrollmentFee: "last_name",
};

export interface PaginatedAdminUsersResult {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PaginatedAdminUsersParams extends AdminDirectoryFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  sort?: SortKey;
  dir?: "asc" | "desc";
  /** When true, load the locked-role directory (in-memory facets + relation filters). */
  lockedDirectory?: boolean;
}

export async function loadPaginatedAdminUsers(
  adminClient: SupabaseClient,
  emptyValue: string,
  params: PaginatedAdminUsersParams = {},
): Promise<PaginatedAdminUsersResult> {
  if (params.lockedDirectory && isLockedDirectoryRole(params.role)) {
    const loaded = await loadAdminLockedRoleDirectory(adminClient, emptyValue, params);
    return {
      rows: loaded.rows,
      totalCount: loaded.totalCount,
      page: loaded.page,
      pageSize: loaded.pageSize,
    };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sortCol = SORT_COLUMN_MAP[params.sort ?? "name"] ?? "last_name";
  const ascending = (params.dir ?? "asc") === "asc";
  const qRaw = (params.q ?? "").trim();
  const roleFilter = params.role ?? ROLE_FILTER_ALL;

  let emailMatchUserId: string | null = null;
  if (qRaw && looksLikeFullEmailQuery(qRaw)) {
    const { userId } = await findAuthUserIdByNormalizedEmail(adminClient, qRaw);
    emailMatchUserId = userId;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = adminClient
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .neq("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);

  let countQuery = adminClient
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .neq("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);

  for (const id of ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS) {
    dataQuery = dataQuery.neq("id", id);
    countQuery = countQuery.neq("id", id);
  }

  if (roleFilter !== ROLE_FILTER_ALL) {
    dataQuery = dataQuery.eq("role", roleFilter);
    countQuery = countQuery.eq("role", roleFilter);
  }

  if (roleFilter === "parent") {
    if (params.access === "never") {
      dataQuery = dataQuery.is("last_session_start_at", null);
      countQuery = countQuery.is("last_session_start_at", null);
    } else if (params.access === "entered") {
      dataQuery = dataQuery.not("last_session_start_at", "is", null);
      countQuery = countQuery.not("last_session_start_at", "is", null);
    }
    if (params.section) {
      const parentIds = await loadParentIdsForActiveSection(adminClient, params.section);
      if (parentIds.length === 0) {
        return { rows: [], totalCount: 0, page, pageSize };
      }
      dataQuery = dataQuery.in("id", parentIds);
      countQuery = countQuery.in("id", parentIds);
    }
  }

  if (qRaw) {
    const filter = buildAdminUsersProfileOrFilter(qRaw, emailMatchUserId);
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

  const profiles = (dataResult.data ?? []) as Array<Record<string, unknown>>;
  const profileIds = profiles.map((p: Record<string, unknown>) => p.id as string);

  const loadStudentExtras = roleFilter === "student";
  const loadTeacherSections = roleFilter === "teacher";
  const loadParentExtras = roleFilter === "parent";
  const emailById = new Map<string, string>();
  if (!loadStudentExtras) {
    await Promise.all(
      profileIds.map(async (id) => {
        const { data } = await adminClient.auth.admin.getUserById(id);
        if (data?.user?.email) {
          emailById.set(id, data.user.email);
        }
      }),
    );
  }

  const [sectionSet, extras, teacherSections, parentExtras] = await Promise.all([
    loadStudentExtras || loadTeacherSections || loadParentExtras
      ? Promise.resolve(new Set<string>())
      : loadActiveEnrollmentSet(adminClient, profileIds),
    loadStudentExtras
      ? loadAdminStudentDirectoryExtras(adminClient, profileIds)
      : Promise.resolve(emptyAdminStudentDirectoryExtras()),
    loadTeacherSections
      ? loadAdminTeacherDirectorySections(adminClient, profileIds)
      : Promise.resolve(new Map()),
    loadParentExtras
      ? loadAdminParentDirectoryExtras(adminClient, profileIds)
      : Promise.resolve(emptyAdminParentDirectoryExtras()),
  ]);

  const rows: AdminUserRow[] = await Promise.all(
    profiles.map(async (p: Record<string, unknown>) => {
      const id = p.id as string;
      const role = (p.role as string) ?? emptyValue;
      const avatarDisplayUrl = await resolveAvatarUrlForAdmin(
        adminClient,
        p.avatar_url as string | null,
      );
      const rawEmail = emailById.get(id) ?? "";
      const sections = loadTeacherSections
        ? (teacherSections.get(id) ?? [])
        : loadParentExtras
          ? (parentExtras.sectionsByParent.get(id) ?? [])
          : (extras.sectionsByStudent.get(id) ?? []);
      return {
        id,
        email: rawEmail || emptyValue,
        firstName: (p.first_name as string) ?? emptyValue,
        lastName: (p.last_name as string) ?? emptyValue,
        role,
        phone: (p.phone as string)?.trim() || emptyValue,
        avatarDisplayUrl,
        missingSection:
          role.toLowerCase() === "student" &&
          (loadStudentExtras ? sections.length === 0 : !sectionSet.has(id)),
        sections,
        parents: extras.parentsByStudent.get(id) ?? [],
        children: parentExtras.childrenByParent.get(id) ?? [],
        monthlyDue: extras.monthlyDueByStudent.get(id) ?? [],
        monthlyStatus: extras.billingFlagsByStudent.get(id)?.monthlyStatus ?? "na",
        enrollmentFeeStatus: extras.billingFlagsByStudent.get(id)?.enrollmentFeeStatus ?? "na",
        lastEnrollmentAt: extras.billingFlagsByStudent.get(id)?.lastEnrollmentAt ?? null,
        lastSessionStartAt: (p.last_session_start_at as string | null) ?? null,
        emailDeliverable: isDeliverableAuthEmail(rawEmail),
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

