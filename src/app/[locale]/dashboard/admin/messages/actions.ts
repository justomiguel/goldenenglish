"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { isRecipientAllowedForAdmin } from "@/lib/messaging/messagingRecipientRules";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const bodySchema = z.string().min(1).max(80000);

export async function sendAdminMessage(
  locale: string,
  recipientId: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFallback = dict.admin.messages.senderNameFallback;

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

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, message: msg.forbidden };

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", rid.data)
    .maybeSingle();
  if (!isRecipientAllowedForAdmin(recipientProfile?.role, user.id, rid.data)) {
    return { ok: false, message: msg.invalidRecipient };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile
    ? formatProfileNameSurnameFirst(profile.first_name, profile.last_name)
    : senderFallback;
  const result = await sendStaffMessageUseCase({
    supabase,
    senderId: user.id,
    senderDisplayName: name || senderFallback,
    recipientId: rid.data,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: mapMessagingUseCaseCode(result.message, msg) };
  }
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  return { ok: true };
}
