import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsersSpreadsheetExportRow } from "@/lib/users/buildUsersSpreadsheetXlsx";
import type { UsersExportScope } from "@/lib/users/resolveUsersExportScope";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS,
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import {
  buildAdminUsersProfileOrFilter,
  looksLikeFullEmailQuery,
} from "@/lib/dashboard/buildAdminUsersProfileOrFilter";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

export const USERS_SPREADSHEET_EXPORT_MAX_ROWS = 2000;

const PROFILE_SELECT =
  "id, role, first_name, last_name, phone, dni_or_passport, birth_date";

type ProfileRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  dni_or_passport: string | null;
  birth_date: string | null;
};

async function emailsForIds(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) map.set(id, data.user.email);
    }),
  );
  return map;
}

function toExportRows(
  profiles: ProfileRow[],
  emailById: Map<string, string>,
): UsersSpreadsheetExportRow[] {
  return profiles.map((p) => ({
    email: emailById.get(p.id) ?? "",
    role: (p.role ?? "").trim(),
    first_name: (p.first_name ?? "").trim(),
    last_name: (p.last_name ?? "").trim(),
    dni_or_passport: p.dni_or_passport,
    phone: p.phone,
    birth_date: p.birth_date,
  }));
}

export type LoadProfilesForUsersExportResult =
  | { ok: true; rows: UsersSpreadsheetExportRow[] }
  | { ok: false; code: "too_many_rows" | "query_failed"; total?: number };

export async function loadProfilesForUsersExport(
  admin: SupabaseClient,
  scope: Exclude<UsersExportScope, { kind: "template" }>,
  filter: { q?: string; role?: string },
): Promise<LoadProfilesForUsersExportResult> {
  let profiles: ProfileRow[] = [];

  if (scope.kind === "ids") {
    const ids = scope.ids.filter((id) => id.trim().length > 0);
    if (ids.length > USERS_SPREADSHEET_EXPORT_MAX_ROWS) {
      return { ok: false, code: "too_many_rows", total: ids.length };
    }
    profiles = await chunkedIn<ProfileRow>(
      admin,
      "profiles",
      "id",
      ids,
      PROFILE_SELECT,
    );
  } else {
    const qRaw = (filter.q ?? "").trim();
    const roleFilter = filter.role ?? ROLE_FILTER_ALL;

    let emailMatchUserId: string | null = null;
    if (qRaw && looksLikeFullEmailQuery(qRaw)) {
      const { userId } = await findAuthUserIdByNormalizedEmail(admin, qRaw);
      emailMatchUserId = userId;
    }

    let query = admin
      .from("profiles")
      .select(PROFILE_SELECT, { count: "exact" })
      .neq("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);

    for (const id of ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS) {
      query = query.neq("id", id);
    }
    if (scope.kind === "filter") {
      if (roleFilter !== ROLE_FILTER_ALL) {
        query = query.eq("role", roleFilter);
      }
      if (qRaw) {
        query = query.or(buildAdminUsersProfileOrFilter(qRaw, emailMatchUserId));
      }
    }

    const { data, error, count } = await query
      .order("last_name", { ascending: true })
      .range(0, USERS_SPREADSHEET_EXPORT_MAX_ROWS - 1);

    if (error) return { ok: false, code: "query_failed" };
    const total = count ?? (data ?? []).length;
    if (total > USERS_SPREADSHEET_EXPORT_MAX_ROWS) {
      return { ok: false, code: "too_many_rows", total };
    }
    profiles = (data ?? []) as ProfileRow[];
  }

  const emailById = await emailsForIds(
    admin,
    profiles.map((p) => p.id),
  );
  return { ok: true, rows: toExportRows(profiles, emailById) };
}
