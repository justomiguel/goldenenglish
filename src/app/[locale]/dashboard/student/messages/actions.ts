"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendStudentMessageUseCase } from "@/lib/messaging/useCases/sendStudentMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const bodySchema = z.string().min(1).max(80000);

export async function sendStudentMessage(
  locale: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFb = dict.dashboard.student.messagesSenderFallback;

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
  if (profile?.role !== "student") return { ok: false, message: msg.forbidden };

  const name = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const result = await sendStudentMessageUseCase({
    supabase,
    studentId: user.id,
    studentDisplayName: name || senderFb,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: mapMessagingUseCaseCode(result.message, msg) };
  }
  revalidatePath(`/${locale}/dashboard/student/messages`);
  return { ok: true };
}

export async function deleteStudentMessage(
  locale: string,
  messageId: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;

  const id = z.string().uuid().safeParse(messageId);
  if (!id.success) return { ok: false, message: msg.invalidId };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") return { ok: false, message: msg.forbidden };

  const { error } = await supabase
    .from("portal_messages")
    .delete()
    .eq("id", id.data)
    .eq("sender_id", user.id);

  if (error) return { ok: false, message: msg.persistFailed };
  revalidatePath(`/${locale}/dashboard/student/messages`);
  return { ok: true };
}
