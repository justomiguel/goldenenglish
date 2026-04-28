"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { replyToStudentMessageUseCase } from "@/lib/messaging/useCases/replyToStudentMessage";
import { isRecipientAllowedForTeacher } from "@/lib/messaging/messagingRecipientRules";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const replySchema = z.string().min(1).max(80000);

export async function replyToStudentMessage(
  locale: string,
  messageId: string,
  replyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFb = dict.dashboard.teacher.messagesSenderFallback;

  const id = z.string().uuid().safeParse(messageId);
  if (!id.success) return { ok: false, message: msg.invalidId };

  const parsed = replySchema.safeParse(replyHtml);
  if (!parsed.success) return { ok: false, message: msg.invalidReply };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: msg.emptyReply };
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
  if (!profile) return { ok: false, message: msg.forbidden };
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) return { ok: false, message: msg.forbidden };

  const name = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const result = await replyToStudentMessageUseCase({
    supabase,
    messageId: id.data,
    teacherId: user.id,
    teacherDisplayName: name || senderFb,
    replyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: mapMessagingUseCaseCode(result.message, msg) };
  }
  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.teacherMessageReply,
    metadata: { message_id: id.data },
  });
  revalidatePath(`/${locale}/dashboard/teacher/messages`);
  return { ok: true };
}

const bodySchema = z.string().min(1).max(80000);

export async function sendTeacherMessage(
  locale: string,
  recipientId: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFb = dict.dashboard.teacher.messagesSenderFallback;

  const rid = z.string().uuid().safeParse(recipientId);
  if (!rid.success) return { ok: false, message: msg.invalidRecipient };

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
  if (!profile) return { ok: false, message: msg.forbidden };
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) return { ok: false, message: msg.forbidden };

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", rid.data)
    .maybeSingle();
  if (!isRecipientAllowedForTeacher(recipientProfile?.role)) {
    return { ok: false, message: msg.invalidRecipient };
  }

  const name = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const result = await sendStaffMessageUseCase({
    supabase,
    senderId: user.id,
    senderDisplayName: name || senderFb,
    recipientId: rid.data,
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
    entity: AnalyticsEntity.teacherMessageSent,
    metadata: { recipient_id: rid.data },
  });
  revalidatePath(`/${locale}/dashboard/teacher/messages`);
  return { ok: true };
}
