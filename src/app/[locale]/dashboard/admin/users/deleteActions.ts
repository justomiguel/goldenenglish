"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";
import { buildAdminUserDeletionPlan } from "@/lib/dashboard/buildAdminUserDeletionPlan";
import { buildAdminDeletionAddedStudentPreviewRows } from "@/lib/dashboard/buildAdminDeletionAddedStudentPreviewRows";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

/** Pre-computes guardians + dependent students deletion order before commit (UI confirmation). */
export async function previewAdminUserDeletionPlan(
  locale: string,
  rawIds: unknown[],
): Promise<
  | { ok: false; message: string }
  | {
      ok: true;
      orderedIds: string[];
      totalCount: number;
      addedStudentCount: number;
      guardianDeletingCount: number;
      addedStudents: { id: string; label: string }[];
    }
> {
  const dict = await getDictionary(locale);
  const U = dict.admin.users;
  let adminUserId: string;
  try {
    const { user } = await assertAdmin();
    adminUserId = user.id;
  } catch {
    logServerAuthzDenied("previewAdminUserDeletionPlan");
    return { ok: false, message: U.errDeleteForbidden };
  }

  const parsed = idsSchema.safeParse(rawIds);
  if (!parsed.success) return { ok: false, message: U.errDeleteInvalid };

  const sanitized = [...new Set(parsed.data)].filter((id) => id !== adminUserId);
  if (sanitized.length === 0) {
    return { ok: false, message: U.errDeleteInvalid };
  }

  const admin = createAdminClient();
  const planPreview = await buildAdminUserDeletionPlan(admin, sanitized);
  if ("error" in planPreview) {
    return { ok: false, message: U.errDeleteInvalid };
  }

  const guardianDeletingCount = planPreview.parentTutorTriggers.length;

  const addedStudentIds = planPreview.cascadeStudentIds.filter((sid) => !sanitized.includes(sid));
  const profileRows =
    addedStudentIds.length === 0
      ? []
      : await chunkedIn<{ id: string; first_name?: string | null; last_name?: string | null }>(
          admin,
          "profiles",
          "id",
          addedStudentIds,
          "id,first_name,last_name",
        );
  const addedStudents = buildAdminDeletionAddedStudentPreviewRows(addedStudentIds, profileRows);

  return {
    ok: true,
    orderedIds: planPreview.orderedIds,
    totalCount: planPreview.orderedIds.length,
    addedStudentCount: planPreview.addedStudentCount,
    guardianDeletingCount,
    addedStudents,
  };
}

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

  const sanitized = [...new Set(parsed.data)].filter((id) => id !== adminUserId);
  if (sanitized.length === 0) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const plan = await buildAdminUserDeletionPlan(admin, sanitized);
  if ("error" in plan) return { ok: false };
  const { orderedIds: toDeleteOrdered, cascadeStudentIds } = plan;

  const { data: beforeProfiles } = await admin
    .from("profiles")
    .select("id, role, first_name, last_name, dni_or_passport, phone")
    .in("id", toDeleteOrdered);
  let deleted = 0;
  let lastError: string | undefined;
  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const id of toDeleteOrdered) {
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
    metadata: {
      requested_ids: sanitized,
      expanded_ids: toDeleteOrdered,
      cascade_students_included: cascadeStudentIds,
      expanded_total: toDeleteOrdered.length,
      deleted,
      failed: failedIds.length,
    },
  });

  revalidatePath(`/${locale}/dashboard/admin/users`, "page");

  if (deleted === 0 && lastError) {
    return { ok: false, message: U.errDeleteAllFailed, deleted: 0 };
  }
  if (deleted < toDeleteOrdered.length) {
    return {
      ok: true,
      deleted,
      partial: true,
    };
  }
  return { ok: true, deleted };
}
