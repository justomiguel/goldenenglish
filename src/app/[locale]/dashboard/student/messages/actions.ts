"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendStudentMessageUseCase } from "@/lib/messaging/useCases/sendStudentMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

const bodySchema = z.string().min(1).max(80000);

export async function sendStudentMessage(
  locale: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
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
  if (profile?.role !== "student") return { ok: false, message: "Forbidden" };

  const name = `${profile.first_name} ${profile.last_name}`.trim();
  const result = await sendStudentMessageUseCase({
    supabase,
    studentId: user.id,
    studentDisplayName: name || "Student",
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath(`/${locale}/dashboard/student/messages`);
  return { ok: true };
}

export async function deleteStudentMessage(
  locale: string,
  messageId: string,
): Promise<{ ok: boolean; message?: string }> {
  const id = z.string().uuid().safeParse(messageId);
  if (!id.success) return { ok: false, message: "Invalid id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") return { ok: false, message: "Forbidden" };

  const { error } = await supabase
    .from("student_messages")
    .delete()
    .eq("id", id.data)
    .eq("student_id", user.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${locale}/dashboard/student/messages`);
  return { ok: true };
}
