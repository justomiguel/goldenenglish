"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

export async function deleteAdminUsers(
  locale: string,
  rawIds: string[],
): Promise<{
  ok: boolean;
  deleted?: number;
  message?: string;
}> {
  let adminUserId: string;
  try {
    const { user } = await assertAdmin();
    adminUserId = user.id;
  } catch {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = idsSchema.safeParse(rawIds);
  if (!parsed.success) return { ok: false, message: "Invalid data" };

  const toDelete = [...new Set(parsed.data)].filter((id) => id !== adminUserId);
  if (toDelete.length === 0) {
    return { ok: false, message: "none" };
  }

  const admin = createAdminClient();
  let deleted = 0;
  let lastError: string | undefined;

  for (const id of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      lastError = error.message;
    } else {
      deleted += 1;
    }
  }

  revalidatePath(`/${locale}/dashboard/admin/users`, "page");

  if (deleted === 0 && lastError) {
    return { ok: false, message: lastError, deleted: 0 };
  }
  if (deleted < toDelete.length) {
    return {
      ok: true,
      deleted,
      message: "partial",
    };
  }
  return { ok: true, deleted };
}
