"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendParentMessageUseCase } from "@/lib/messaging/useCases/sendParentMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const bodySchema = z.string().min(1).max(80000);

export async function sendParentMessage(
  locale: string,
  teacherId: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFb = dict.dashboard.parent.messagesSenderFallback;

  const tid = z.string().uuid().safeParse(teacherId);
  if (!tid.success) return { ok: false, message: msg.invalidRecipient };

  const parsed = bodySchema.safeParse(bodyHtml);
  if (!parsed.success) return { ok: false, message: msg.invalidMessage };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: msg.emptyMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") return { ok: false, message: msg.forbidden };

  const name = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const result = await sendParentMessageUseCase({
    supabase,
    parentId: user.id,
    parentDisplayName: name || senderFb,
    teacherId: tid.data,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: mapMessagingUseCaseCode(result.message, msg) };
  }
  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.parentMessageSent,
    metadata: { recipient_id: tid.data },
  });
  revalidatePath(`/${locale}/dashboard/parent/messages`);
  return { ok: true };
}
