import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/** Sets read_at when still null (idempotent). Recipient or admin session. */
export async function markAdminPortalMessageRead(
  supabase: SupabaseClient,
  messageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("portal_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .is("read_at", null);

  if (error) {
    logSupabaseClientError("markAdminPortalMessageRead", error, { messageId });
  }
}

/** Clears read_at so the row appears unread again. Recipient or admin session. */
export async function markAdminPortalMessageUnread(
  supabase: SupabaseClient,
  messageId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { error } = await supabase
    .from("portal_messages")
    .update({ read_at: null })
    .eq("id", messageId);

  if (error) {
    logSupabaseClientError("markAdminPortalMessageUnread", error, { messageId });
    return { ok: false };
  }
  return { ok: true };
}

/** Force-sets read_at (used by list toggle when marking read). */
export async function forceAdminPortalMessageRead(
  supabase: SupabaseClient,
  messageId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { error } = await supabase
    .from("portal_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) {
    logSupabaseClientError("forceAdminPortalMessageRead", error, { messageId });
    return { ok: false };
  }
  return { ok: true };
}

/** Marks external_replied_at (+ read_at) on a site-contact broadcast batch or single row. */
export async function markAdminPortalExternalReplied(
  supabase: SupabaseClient,
  params: { messageId: string; broadcastBatchId: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  const patch = { external_replied_at: now, read_at: now };

  if (params.broadcastBatchId) {
    const { error } = await supabase
      .from("portal_messages")
      .update(patch)
      .eq("broadcast_batch_id", params.broadcastBatchId);
    if (error) {
      logSupabaseClientError("markAdminPortalExternalReplied:batch", error, {
        messageId: params.messageId,
        broadcastBatchId: params.broadcastBatchId,
      });
    }
    return;
  }

  const { error } = await supabase.from("portal_messages").update(patch).eq("id", params.messageId);
  if (error) {
    logSupabaseClientError("markAdminPortalExternalReplied:row", error, {
      messageId: params.messageId,
    });
  }
}
