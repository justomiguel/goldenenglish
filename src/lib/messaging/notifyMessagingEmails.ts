import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import type { Locale } from "@/types/i18n";

async function authEmailForUserId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function previewBlock(text: string, max = 500): string {
  return text.slice(0, max);
}

function originOrLocal(): string {
  return getPublicSiteUrl()?.origin ?? "http://localhost:3000";
}

function asLocale(value: string): Locale {
  return value === "en" ? "en" : "es";
}

export async function notifyTeacherNewMessage(params: {
  teacherId: string;
  senderName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<void> {
  const to = await authEmailForUserId(params.teacherId);
  if (!to) return;
  const href = `${originOrLocal()}/${params.locale}/dashboard/teacher/messages`;
  await sendBrandedEmail({
    to,
    templateKey: "messaging.teacher_new",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      senderName: escapeHtml(params.senderName),
      messagePreview: escapeHtml(previewBlock(params.messagePreview)),
      href,
    },
  });
}

export async function notifyPortalRecipientForStaffMessage(params: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
  recipientRole: "teacher" | "admin" | "assistant";
}): Promise<void> {
  const to = await authEmailForUserId(params.recipientId);
  if (!to) return;
  const dashboard =
    params.recipientRole === "admin" ? "dashboard/admin/messages" : "dashboard/teacher/messages";
  const href = `${originOrLocal()}/${params.locale}/${dashboard}`;
  const dict = await getDictionary(params.locale);
  await sendBrandedEmail({
    to,
    templateKey: "messaging.staff_portal_new",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      senderName: escapeHtml(params.senderName),
      messagePreview: escapeHtml(previewBlock(params.messagePreview)),
      href,
      openLinkLabel: dict.emailMessaging.staffInboxOpenLink,
    },
  });
}

export async function notifyPortalInboxForStudentOrParent(params: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
  recipientRole: "student" | "parent";
}): Promise<void> {
  const to = await authEmailForUserId(params.recipientId);
  if (!to) return;
  const dashboard =
    params.recipientRole === "parent" ? "dashboard/parent/messages" : "dashboard/student/messages";
  const href = `${originOrLocal()}/${params.locale}/${dashboard}`;
  const dict = await getDictionary(params.locale);
  await sendBrandedEmail({
    to,
    templateKey: "messaging.staff_portal_new",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      senderName: escapeHtml(params.senderName),
      messagePreview: escapeHtml(previewBlock(params.messagePreview)),
      href,
      openLinkLabel: dict.emailMessaging.portalOpenMessages,
    },
  });
}

export async function notifyStudentTeacherReplied(params: {
  studentId: string;
  teacherName: string;
  replyPreview: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<void> {
  const to = await authEmailForUserId(params.studentId);
  if (!to) return;
  const href = `${originOrLocal()}/${params.locale}/dashboard/student/messages`;
  const dict = await getDictionary(params.locale);
  await sendBrandedEmail({
    to,
    templateKey: "messaging.reply",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      teacherName: escapeHtml(params.teacherName),
      replyPreview: escapeHtml(previewBlock(params.replyPreview)),
      href,
      openLinkLabel: dict.emailMessaging.portalOpenMessages,
    },
  });
}

export async function notifyParentTeacherReplied(params: {
  parentId: string;
  teacherName: string;
  replyPreview: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<void> {
  const to = await authEmailForUserId(params.parentId);
  if (!to) return;
  const href = `${originOrLocal()}/${params.locale}/dashboard/parent/messages`;
  const dict = await getDictionary(params.locale);
  await sendBrandedEmail({
    to,
    templateKey: "messaging.reply",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      teacherName: escapeHtml(params.teacherName),
      replyPreview: escapeHtml(previewBlock(params.replyPreview)),
      href,
      openLinkLabel: dict.emailMessaging.portalOpenMessages,
    },
  });
}
