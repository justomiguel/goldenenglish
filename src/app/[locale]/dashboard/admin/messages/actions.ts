"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

const bodySchema = z.string().min(1).max(80000);

export async function sendAdminMessage(
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

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, message: "Forbidden" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Admin";
  const result = await sendStaffMessageUseCase({
    supabase,
    senderId: user.id,
    senderDisplayName: name || "Admin",
    recipientId: rid.data,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  return { ok: true };
}
