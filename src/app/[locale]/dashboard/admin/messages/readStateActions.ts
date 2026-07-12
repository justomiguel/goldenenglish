"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  forceAdminPortalMessageRead,
  markAdminPortalMessageUnread,
} from "@/lib/messaging/markAdminPortalMessageAttention";

const messageIdSchema = z.string().uuid();

export type SetAdminPortalMessageReadStateCode =
  | "invalid_id"
  | "unauthorized"
  | "forbidden"
  | "persist_failed";

/**
 * Toggle inbox read state for one portal_messages row (admin session).
 * `unread: true` clears read_at; `unread: false` sets read_at now.
 */
export async function setAdminPortalMessageReadState(
  locale: string,
  messageId: string,
  unread: boolean,
): Promise<{ ok: true } | { ok: false; code: SetAdminPortalMessageReadStateCode }> {
  const parsed = messageIdSchema.safeParse(messageId);
  if (!parsed.success) return { ok: false, code: "invalid_id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "unauthorized" };

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, code: "forbidden" };

  const result = unread
    ? await markAdminPortalMessageUnread(supabase, parsed.data)
    : await forceAdminPortalMessageRead(supabase, parsed.data);

  if (!result.ok) {
    logServerWarn("setAdminPortalMessageReadState:persist", {
      scope: "adminMessages",
      messageId: parsed.data,
      unread,
    });
    return { ok: false, code: "persist_failed" };
  }

  // Confirm the session can still see the row (RLS may no-op updates silently).
  const { data: row, error } = await supabase
    .from("portal_messages")
    .select("id, read_at")
    .eq("id", parsed.data)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("setAdminPortalMessageReadState:verify", error, {
      messageId: parsed.data,
    });
  } else if (!row) {
    return { ok: false, code: "persist_failed" };
  }

  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/messages/${parsed.data}`);
  return { ok: true };
}
