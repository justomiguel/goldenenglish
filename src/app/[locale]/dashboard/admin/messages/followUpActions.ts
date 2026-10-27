"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const followUpSchema = z.object({
  locale: z.string().min(2).max(12),
  messageId: z.string().uuid(),
  channel: z.enum(["whatsapp", "mailto", "gmail", "outlook"]),
});

export async function recordPortalMessageFollowUp(
  input: z.infer<typeof followUpSchema>,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("portal_message_follow_ups").insert({
      message_id: parsed.data.messageId,
      actor_id: user.id,
      channel: parsed.data.channel,
    });
    if (error) {
      logSupabaseClientError("recordPortalMessageFollowUp", error, {
        messageId: parsed.data.messageId,
        channel: parsed.data.channel,
      });
      return { ok: false, error: "failed" };
    }

    await recordSystemAudit({
      action: "portal_message_follow_up",
      resourceType: "portal_message",
      resourceId: parsed.data.messageId,
      payload: { channel: parsed.data.channel },
    });

    revalidatePath(`/${parsed.data.locale}/dashboard/admin/messages`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/messages/${parsed.data.messageId}`);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("recordPortalMessageFollowUp", { reason: message });
      return { ok: false, error: "forbidden" };
    }
    logServerException("recordPortalMessageFollowUp", error);
    return { ok: false, error: "failed" };
  }
}
