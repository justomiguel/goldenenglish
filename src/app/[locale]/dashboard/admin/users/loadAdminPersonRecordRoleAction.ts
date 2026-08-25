"use server";

import { loadAdminPersonRecordRole } from "@/app/[locale]/dashboard/admin/users/loadAdminPersonRecordRole";

export async function loadAdminPersonRecordRoleAction(userId: string): Promise<string | null> {
  return loadAdminPersonRecordRole(userId);
}
