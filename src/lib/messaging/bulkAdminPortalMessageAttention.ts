import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/** Force-sets read_at for many portal_messages rows. */
export async function bulkForceAdminPortalMessageRead(
  supabase: SupabaseClient,
  ids: string[],
): Promise<{ ok: true } | { ok: false }> {
  if (ids.length === 0) return { ok: true };
  const { error } = await supabase
    .from("portal_messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    logSupabaseClientError("bulkForceAdminPortalMessageRead", error, { count: ids.length });
    return { ok: false };
  }
  return { ok: true };
}

/** Clears read_at for many portal_messages rows. */
export async function bulkMarkAdminPortalMessageUnread(
  supabase: SupabaseClient,
  ids: string[],
): Promise<{ ok: true } | { ok: false }> {
  if (ids.length === 0) return { ok: true };
  const { error } = await supabase.from("portal_messages").update({ read_at: null }).in("id", ids);

  if (error) {
    logSupabaseClientError("bulkMarkAdminPortalMessageUnread", error, { count: ids.length });
    return { ok: false };
  }
  return { ok: true };
}
