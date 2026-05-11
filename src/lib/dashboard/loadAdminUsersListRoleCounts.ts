import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  parseAdminUsersListRoleCountsPayload,
  type AdminUsersListRoleCounts,
} from "@/lib/dashboard/parseAdminUsersListRoleCountsPayload";

export type { AdminUsersListRoleCounts };

/**
 * Loads role totals for the admin users filter dropdown via Postgres RPC
 * `admin_users_list_role_counts`.
 */
export async function loadAdminUsersListRoleCounts(
  adminClient: SupabaseClient,
): Promise<AdminUsersListRoleCounts> {
  const { data, error } = await adminClient.rpc("admin_users_list_role_counts");

  if (error) {
    logSupabaseClientError("loadAdminUsersListRoleCounts:rpc", error, {});
    return parseAdminUsersListRoleCountsPayload(null);
  }

  return parseAdminUsersListRoleCountsPayload(data);
}
