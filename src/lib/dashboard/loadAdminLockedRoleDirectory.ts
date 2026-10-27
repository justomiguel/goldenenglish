import type { SupabaseClient } from "@supabase/supabase-js";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS,
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import {
  buildAdminUsersProfileOrFilter,
  looksLikeFullEmailQuery,
} from "@/lib/dashboard/buildAdminUsersProfileOrFilter";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";
import {
  emptyAdminStudentDirectoryExtras,
  loadAdminStudentDirectoryExtras,
} from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import {
  emptyAdminParentDirectoryExtras,
  loadAdminParentDirectoryExtras,
} from "@/lib/dashboard/loadAdminParentDirectoryExtras";
import { loadAdminTeacherDirectoryWithRoles } from "@/lib/dashboard/loadAdminTeacherDirectorySections";
import { loadActiveSectionFilterOptions } from "@/lib/dashboard/loadActiveSectionFilterOptions";
import { buildAdminDirectoryCandidates } from "@/lib/dashboard/buildAdminDirectoryCandidates";
import { filterAdminDirectoryCandidates } from "@/lib/dashboard/matchAdminDirectoryCandidate";
import {
  countAdminDirectoryFacets,
  emptyAdminDirectoryFacets,
  type AdminDirectoryFacets,
} from "@/lib/dashboard/countAdminDirectoryFacets";
import { type AdminDirectoryRole } from "@/lib/dashboard/adminDirectoryFilters";
import type { PaginatedAdminUsersParams, PaginatedAdminUsersResult } from "@/lib/dashboard/loadPaginatedAdminUsers";
import type { AdminUserRow, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import {
  EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  sortAdminUsers,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { profileToAdminDirectorySortRow } from "@/lib/dashboard/profileToAdminDirectorySortRow";
import { directoryBillingRowFields } from "@/lib/dashboard/directoryBillingStatus";
import { resolveDirectorySortCriteria } from "@/lib/academic-profile/academicDirectorySort";
import { applyAcademicProfileDirectoryFilter } from "@/lib/dashboard/applyAcademicProfileDirectoryFilter";
import { directoryFiltersFromParams, emailsById } from "@/lib/dashboard/lockedDirectoryQueryHelpers";

const PROFILE_COLUMNS =
  "id, role, first_name, last_name, phone, avatar_url, last_session_start_at, created_at, age_years";

export type AdminLockedRoleDirectoryResult = PaginatedAdminUsersResult & {
  facets: AdminDirectoryFacets;
  sectionOptions: { id: string; name: string }[];
  academicColumns: { id: string; label: string; fieldType: string; selectOptions: string[] }[];
  academicSelectFacets: Record<string, Record<string, number>>;
};

type ProfileStub = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  last_session_start_at: string | null;
  created_at: string | null;
  age_years: number | null;
};

export async function loadAdminLockedRoleDirectory(
  adminClient: SupabaseClient,
  emptyValue: string,
  params: PaginatedAdminUsersParams,
): Promise<AdminLockedRoleDirectoryResult> {
  const role = params.role as AdminDirectoryRole;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const qRaw = (params.q ?? "").trim();
  const sortCriteria =
    params.sortCriteria && params.sortCriteria.length > 0
      ? params.sortCriteria
      : [{ key: (params.sort ?? "name") as SortKey, dir: params.dir === "desc" ? "desc" as const : "asc" as const }];
  const filters = directoryFiltersFromParams(params);
  const empty = {
    rows: [] as AdminUserRow[],
    totalCount: 0,
    page,
    pageSize,
    facets: emptyAdminDirectoryFacets(),
    sectionOptions: [] as { id: string; name: string }[],
    academicColumns: [],
    academicSelectFacets: {},
  };
  if (role !== "student" && role !== "teacher" && role !== "parent") return empty;

  let emailMatchUserId: string | null = null;
  if (qRaw && looksLikeFullEmailQuery(qRaw)) {
    const { userId } = await findAuthUserIdByNormalizedEmail(adminClient, qRaw);
    emailMatchUserId = userId;
  }

  let query = adminClient
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .neq("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE)
    .eq("role", role);
  for (const id of ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS) {
    query = query.neq("id", id);
  }
  if (qRaw) query = query.or(buildAdminUsersProfileOrFilter(qRaw, emailMatchUserId));

  const [dataResult, sectionOptions] = await Promise.all([
    query,
    loadActiveSectionFilterOptions(adminClient),
  ]);
  const profiles = (dataResult.data ?? []) as ProfileStub[];
  const profileIds = profiles.map((p) => p.id);

  const [studentExtras, teacherBundle, parentExtras, emailById] = await Promise.all([
    role === "student"
      ? loadAdminStudentDirectoryExtras(adminClient, profileIds)
      : Promise.resolve(emptyAdminStudentDirectoryExtras()),
    role === "teacher"
      ? loadAdminTeacherDirectoryWithRoles(adminClient, profileIds)
      : Promise.resolve({ sections: new Map(), leadIds: new Map(), assistantIds: new Map() }),
    role === "parent"
      ? loadAdminParentDirectoryExtras(adminClient, profileIds)
      : Promise.resolve(emptyAdminParentDirectoryExtras()),
    role === "student" ? Promise.resolve(new Map<string, string>()) : emailsById(adminClient, profileIds),
  ]);

  const deliverable = new Map<string, boolean>();
  for (const [id, raw] of emailById) deliverable.set(id, isDeliverableAuthEmail(raw));

  const sectionsByPerson =
    role === "teacher"
      ? teacherBundle.sections
      : role === "parent"
        ? parentExtras.sectionsByParent
        : studentExtras.sectionsByStudent;

  const billingFlagsByPerson =
    role === "parent" ? parentExtras.billingFlagsByParent : studentExtras.billingFlagsByStudent;
  const monthlyStatusByPerson = new Map(
    [...billingFlagsByPerson].map(([id, flags]) => [id, flags.monthlyStatus]),
  );
  const candidates = buildAdminDirectoryCandidates({
    profiles,
    sectionsByPerson,
    leadIdsByTeacher: teacherBundle.leadIds,
    assistantIdsByTeacher: teacherBundle.assistantIds,
    parentsByStudent: studentExtras.parentsByStudent,
    monthlyDueByStudent: studentExtras.monthlyDueByStudent,
    monthlyStatusByPerson,
    childrenByParent: parentExtras.childrenByParent,
    emailDeliverableById: deliverable,
  });
  const matched = filterAdminDirectoryCandidates(candidates, filters);
  const matchedIds = new Set(matched.map((c) => c.id));
  const sortExtras = {
    sectionsByPerson,
    parentsByStudent: studentExtras.parentsByStudent,
    childrenByParent: parentExtras.childrenByParent,
    monthlyDueByStudent: studentExtras.monthlyDueByStudent,
    billingFlagsByPerson,
    emailById,
    deliverable,
  };
  const matchedProfiles = profiles.filter((p) => matchedIds.has(p.id));
  const profileById = new Map(matchedProfiles.map((profile) => [profile.id, profile]));
  const academic = role === "student"
    ? await applyAcademicProfileDirectoryFilter(
        adminClient,
        matchedProfiles.map((profile) => profile.id),
        params.academicFieldFilters ?? {},
      )
    : null;
  const activeCriteria = resolveDirectorySortCriteria(
    sortCriteria,
    new Set((academic?.columns ?? []).map((column) => column.id)),
  );
  const poolIds = academic ? academic.ids : matchedProfiles.map((profile) => profile.id);
  const sortedIds = sortAdminUsers(
    poolIds.flatMap((id) => {
      const profile = profileById.get(id);
      if (!profile) return [];
      return [{
        ...profileToAdminDirectorySortRow(profile, role, sortExtras),
        academicSortValues: academic?.sortValuesByStudent.get(id),
      }];
    }),
    activeCriteria,
  ).map((row) => row.id);
  const ordered = sortedIds
    .map((id) => profileById.get(id))
    .filter((profile): profile is ProfileStub => profile != null);
  const from = (page - 1) * pageSize;
  const pageProfiles = ordered.slice(from, from + pageSize);

  const rows: AdminUserRow[] = await Promise.all(
    pageProfiles.map(async (p) => {
      const id = p.id;
      const rawEmail = emailById.get(id) ?? "";
      const sections =
        role === "teacher"
          ? (teacherBundle.sections.get(id) ?? [])
          : role === "parent"
            ? (parentExtras.sectionsByParent.get(id) ?? [])
            : (studentExtras.sectionsByStudent.get(id) ?? []);
      return {
        id,
        email: rawEmail || emptyValue,
        firstName: p.first_name ?? emptyValue,
        lastName: p.last_name ?? emptyValue,
        role: p.role ?? emptyValue,
        phone: p.phone?.trim() || emptyValue,
        avatarDisplayUrl: await resolveAvatarUrlForAdmin(adminClient, p.avatar_url),
        missingSection: role === "student" && sections.length === 0,
        ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
        sections,
        parents: studentExtras.parentsByStudent.get(id) ?? [],
        children: parentExtras.childrenByParent.get(id) ?? [],
        monthlyDue: studentExtras.monthlyDueByStudent.get(id) ?? [],
        ...directoryBillingRowFields(billingFlagsByPerson.get(id)),
        lastSessionStartAt: p.last_session_start_at,
        emailDeliverable: deliverable.get(id) ?? false,
        academicFieldCells: academic?.cellsByStudent.get(id) ?? [],
      };
    }),
  );

  return {
    rows,
    totalCount: ordered.length,
    page,
    pageSize,
    facets: countAdminDirectoryFacets(
      candidates,
      filters,
      sectionOptions.map((s) => s.id),
    ),
    sectionOptions,
    academicColumns: academic?.columns ?? [],
    academicSelectFacets: academic?.selectFacets ?? {},
  };
}

export function isLockedDirectoryRole(role: string | undefined): role is AdminDirectoryRole {
  return role === "student" || role === "teacher" || role === "parent";
}
