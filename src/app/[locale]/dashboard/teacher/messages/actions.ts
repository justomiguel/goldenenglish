"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { replyToStudentMessageUseCase } from "@/lib/messaging/useCases/replyToStudentMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

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
  revalidatePath(`/${locale}/dashboard/teacher/messages`);
  return { ok: true };
}
