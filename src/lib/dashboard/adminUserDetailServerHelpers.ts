import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export function adminUserDetailDictError(dict: Dictionary, code: string): string {
  const u = dict.admin.users as Record<string, string | undefined>;
  const key = `detailErr_${code}`;
  return u[key] ?? dict.admin.users.detailErrSave;
}

export async function mergeAuthUserMetadataPatch(
  admin: SupabaseClient,
  logScope: string,
  userId: string,
  patch: Record<string, string | null>,
): Promise<{ ok: boolean }> {
  const { data: cur, error: readErr } = await admin.auth.admin.getUserById(userId);
  if (readErr || !cur?.user) return { ok: false };
  const prev = (cur.user.user_metadata ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") delete next[k];
    else next[k] = v;
  }
  const { error } = await admin.auth.admin.updateUserById(userId, { user_metadata: next });
  if (error) {
    logSupabaseClientError(`${logScope}:mergeUserMetadata`, error, { userId });
    return { ok: false };
  }
  return { ok: true };
}
