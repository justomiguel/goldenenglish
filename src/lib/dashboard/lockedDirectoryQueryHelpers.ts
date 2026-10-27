import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_DIRECTORY_FILTER_PARAM_KEYS,
  type AdminDirectoryFilters,
} from "@/lib/dashboard/adminDirectoryFilters";
import type { PaginatedAdminUsersParams } from "@/lib/dashboard/loadPaginatedAdminUsers";

export function directoryFiltersFromParams(params: PaginatedAdminUsersParams): AdminDirectoryFilters {
  const out: AdminDirectoryFilters = {};
  for (const key of ADMIN_DIRECTORY_FILTER_PARAM_KEYS) {
    const value = params[key];
    if (value) out[key] = value as never;
  }
  return out;
}

export async function emailsById(admin: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const emailById = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) emailById.set(id, data.user.email);
    }),
  );
  return emailById;
}
