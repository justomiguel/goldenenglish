"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendStudentMessageUseCase } from "@/lib/messaging/useCases/sendStudentMessage";
import { sendStudentMessageToAdministrationUseCase } from "@/lib/messaging/useCases/sendStudentMessageToAdministration";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const bodySchema = z.string().min(1).max(80000);
const destinationSchema = z.enum(["teacher", "administration"]);

export async function sendStudentMessage(
  locale: string,
  bodyHtml: string,
  destinationRaw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFb = dict.dashboard.student.messagesSenderFallback;

  const destinationParse = destinationSchema.safeParse(destinationRaw);
  if (!destinationParse.success) return { ok: false, message: msg.invalidRecipient };

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

  const result =
    destinationParse.data === "administration"
      ? await sendStudentMessageToAdministrationUseCase({
          supabase,
          studentId: user.id,
          studentDisplayName: name || senderFb,
          bodyHtml: safeHtml,
          locale,
          emailProvider: getEmailProvider(),
        })
      : await sendStudentMessageUseCase({
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

  const { data: row, error: selErr } = await supabase
    .from("portal_messages")
    .select("broadcast_batch_id")
    .eq("id", id.data)
    .eq("sender_id", user.id)
    .maybeSingle();

  if (selErr) {
    logSupabaseClientError("deleteStudentMessage:select", selErr, { messageId: id.data });
    return { ok: false, message: msg.persistFailed };
  }

  if (!row) {
    return { ok: false, message: msg.invalidId };
  }

  const batchDelete = row.broadcast_batch_id
    ? await supabase
        .from("portal_messages")
        .delete()
        .eq("broadcast_batch_id", row.broadcast_batch_id)
        .eq("sender_id", user.id)
    : await supabase.from("portal_messages").delete().eq("id", id.data).eq("sender_id", user.id);

  if (batchDelete.error) {
    logSupabaseClientError("deleteStudentMessage:delete", batchDelete.error, { messageId: id.data });
    return { ok: false, message: msg.persistFailed };
  }
  revalidatePath(`/${locale}/dashboard/student/messages`);
  return { ok: true };
}
