"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { normalizeAdminMessageBulkIds } from "@/lib/messaging/adminMessageBulkIds";
import {
  bulkForceAdminPortalMessageRead,
  bulkMarkAdminPortalMessageUnread,
} from "@/lib/messaging/bulkAdminPortalMessageAttention";

export type BulkAdminPortalMessageCode =
  | "empty"
  | "invalid_id"
  | "too_many"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "persist_failed";

function mapNormalizeCode(
  code: "empty" | "invalid_id" | "too_many",
): BulkAdminPortalMessageCode {
  return code;
}

async function assertAdminForBulk(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; code: BulkAdminPortalMessageCode }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "unauthorized" };
  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, code: "forbidden" };
  return { ok: true, supabase };
}

function revalidateMailbox(locale: string, ids: string[]) {
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  for (const id of ids.slice(0, 20)) {
    revalidatePath(`/${locale}/dashboard/admin/messages/${id}`);
  }
}

/**
 * Bulk toggle inbox read state. `unread: true` clears read_at; false sets read_at now.
 */
export async function bulkSetAdminPortalMessageReadState(
  locale: string,
  messageIds: string[],
  unread: boolean,
): Promise<{ ok: true; count: number } | { ok: false; code: BulkAdminPortalMessageCode }> {
  const normalized = normalizeAdminMessageBulkIds(messageIds);
  if (!normalized.ok) return { ok: false, code: mapNormalizeCode(normalized.code) };

  const auth = await assertAdminForBulk();
  if (!auth.ok) return auth;

  const result = unread
    ? await bulkMarkAdminPortalMessageUnread(auth.supabase, normalized.ids)
    : await bulkForceAdminPortalMessageRead(auth.supabase, normalized.ids);

  if (!result.ok) {
    logServerWarn("bulkSetAdminPortalMessageReadState:persist", {
      scope: "adminMessages",
      count: normalized.ids.length,
      unread,
    });
    return { ok: false, code: "persist_failed" };
  }

  revalidateMailbox(locale, normalized.ids);
  return { ok: true, count: normalized.ids.length };
}

/** Bulk delete portal_messages rows visible to the admin session. */
export async function bulkDeleteAdminPortalMessages(
  locale: string,
  messageIds: string[],
): Promise<{ ok: true; count: number } | { ok: false; code: BulkAdminPortalMessageCode }> {
  const normalized = normalizeAdminMessageBulkIds(messageIds);
  if (!normalized.ok) return { ok: false, code: mapNormalizeCode(normalized.code) };

  const auth = await assertAdminForBulk();
  if (!auth.ok) return auth;

  const { data: deleted, error } = await auth.supabase
    .from("portal_messages")
    .delete()
    .in("id", normalized.ids)
    .select("id");

  if (error) {
    logSupabaseClientError("bulkDeleteAdminPortalMessages", error, {
      count: normalized.ids.length,
    });
    return { ok: false, code: "persist_failed" };
  }

  const count = deleted?.length ?? 0;
  if (count === 0) {
    logServerWarn("bulkDeleteAdminPortalMessages:noRow", {
      scope: "adminMessages",
      count: normalized.ids.length,
    });
    return { ok: false, code: "not_found" };
  }

  void recordSystemAudit({
    action: "portal_messages_bulk_deleted",
    resourceType: "portal_message",
    resourceId: deleted![0].id,
    payload: {
      count,
      idsSample: deleted!.slice(0, 10).map((r) => r.id),
    },
  });

  revalidateMailbox(locale, normalized.ids);
  return { ok: true, count };
}
