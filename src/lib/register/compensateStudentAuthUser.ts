import type { SupabaseClient } from "@supabase/supabase-js";

export async function compensateDeleteStudentAuthUser(
  admin: SupabaseClient,
  studentId: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) return { ok: false, message: "rollback_failed" };
  return { ok: true };
}
