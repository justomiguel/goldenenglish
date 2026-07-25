"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { locales } from "@/lib/i18n/dictionaries";
import {
  MESSAGING_DEFAULT_REPLY_MAX_LENGTH,
  MESSAGING_DEFAULT_REPLY_SETTING_KEY,
  type MessagingDefaultReplyTemplates,
} from "@/lib/messaging/messagingDefaultReplyConstants";
import { updateMessagingDefaultReplyTemplate } from "@/lib/messaging/updateMessagingDefaultReplyTemplate";

export type SetMessagingDefaultReplyResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "empty" | "too_long" | "db_error" };

const templatesSchema = z.object({
  es: z.string().max(MESSAGING_DEFAULT_REPLY_MAX_LENGTH),
  en: z.string().max(MESSAGING_DEFAULT_REPLY_MAX_LENGTH),
  pt: z.string().max(MESSAGING_DEFAULT_REPLY_MAX_LENGTH),
});

export async function setMessagingDefaultReplyTemplateAction(
  locale: string,
  templates: MessagingDefaultReplyTemplates,
): Promise<SetMessagingDefaultReplyResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setMessagingDefaultReplyTemplateAction");
    return { ok: false, error: "unauthorized" };
  }

  const parsed = templatesSchema.safeParse(templates);
  if (!parsed.success) {
    return { ok: false, error: "too_long" };
  }

  const supabase = await createClient();
  const result = await updateMessagingDefaultReplyTemplate(supabase, parsed.data);

  if (!result.ok) {
    if (result.error === "db_error") {
      logSupabaseClientError(
        "setMessagingDefaultReplyTemplateAction",
        { message: "db_error" },
        { key: MESSAGING_DEFAULT_REPLY_SETTING_KEY },
      );
    }
    return { ok: false, error: result.error };
  }

  const lengths = Object.fromEntries(
    locales.map((l) => [l, parsed.data[l].trim().length]),
  );

  void recordSystemAudit({
    action: "messaging.default_reply_template.update",
    resourceType: "site_settings",
    resourceId: MESSAGING_DEFAULT_REPLY_SETTING_KEY,
    payload: { lengths },
  });

  revalidatePath(`/${locale}/dashboard/admin/messages`, "layout");
  return { ok: true };
}
