"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { replyToStudentMessageUseCase } from "@/lib/messaging/useCases/replyToStudentMessage";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";

const replySchema = z.string().min(1).max(80000);

export async function replyToStudentMessage(
  locale: string,
  messageId: string,
  replyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const id = z.string().uuid().safeParse(messageId);
  if (!id.success) return { ok: false, message: "Invalid id" };

  const parsed = replySchema.safeParse(replyHtml);
  if (!parsed.success) return { ok: false, message: "Invalid reply" };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: "Reply is empty" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") return { ok: false, message: "Forbidden" };

  const name = `${profile.first_name} ${profile.last_name}`.trim();
  const result = await replyToStudentMessageUseCase({
    supabase,
    messageId: id.data,
    teacherId: user.id,
    teacherDisplayName: name || "Teacher",
    replyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) return { ok: false, message: result.message };
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
  const rid = z.string().uuid().safeParse(recipientId);
  if (!rid.success) return { ok: false, message: "Invalid recipient" };

  const parsed = bodySchema.safeParse(bodyHtml);
  if (!parsed.success) return { ok: false, message: "Invalid message" };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: "Message is empty" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") return { ok: false, message: "Forbidden" };

  const name = `${profile.first_name} ${profile.last_name}`.trim();
  const result = await sendStaffMessageUseCase({
    supabase,
    senderId: user.id,
    senderDisplayName: name || "Teacher",
    recipientId: rid.data,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) return { ok: false, message: result.message };
  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.teacherMessageSent,
    metadata: { recipient_id: rid.data },
  });
  revalidatePath(`/${locale}/dashboard/teacher/messages`);
  return { ok: true };
}
