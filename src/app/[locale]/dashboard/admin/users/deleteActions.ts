"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

export async function deleteAdminUsers(
  locale: string,
  rawIds: string[],
): Promise<{
  ok: boolean;
  deleted?: number;
  partial?: boolean;
  message?: string;
}> {
  const dict = await getDictionary(locale);
  const U = dict.admin.users;
  let adminUserId: string;
  try {
    const { user } = await assertAdmin();
    adminUserId = user.id;
  } catch {
    logServerAuthzDenied("deleteAdminUsers");
    return { ok: false, message: U.errDeleteForbidden };
  }

  const parsed = idsSchema.safeParse(rawIds);
  if (!parsed.success) return { ok: false, message: U.errDeleteInvalid };

  const toDelete = [...new Set(parsed.data)].filter((id) => id !== adminUserId);
  if (toDelete.length === 0) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { data: beforeProfiles } = await admin
    .from("profiles")
    .select("id, role, first_name, last_name, dni_or_passport, phone")
    .in("id", toDelete);
  let deleted = 0;
  let lastError: string | undefined;
  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const id of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      logSupabaseClientError("deleteAdminUsers:authDeleteUser", error, { targetUserId: id });
      lastError = error.message;
      failedIds.push(id);
    } else {
      deleted += 1;
      deletedIds.push(id);
    }
  }

  void auditIdentityAction({
    actorId: adminUserId,
    actorRole: "admin",
    action: "delete",
    resourceType: "profile",
    summary: "Admin deleted dashboard users",
    beforeValues: { profiles: beforeProfiles ?? [] },
    afterValues: { deleted_ids: deletedIds, failed_ids: failedIds },
    metadata: { requested_ids: toDelete, deleted, failed: failedIds.length },
  });

  revalidatePath(`/${locale}/dashboard/admin/users`, "page");

  if (deleted === 0 && lastError) {
    return { ok: false, message: U.errDeleteAllFailed, deleted: 0 };
  }
  if (deleted < toDelete.length) {
    return {
      ok: true,
      deleted,
      partial: true,
    };
  }
  return { ok: true, deleted };
}
