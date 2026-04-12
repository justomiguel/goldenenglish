import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandPublic } from "@/lib/brand/server";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fillTemplate } from "@/lib/i18n/fillTemplate";

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

export async function notifyTeacherNewMessage(params: {
  teacherId: string;
  senderName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<void> {
  const to = await authEmailForUserId(params.teacherId);
  if (!to) return;
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const href = `${origin}/${params.locale}/dashboard/teacher/messages`;
  const dict = await getDictionary(params.locale);
  const m = dict.emailMessaging;
  const subject = fillTemplate(m.teacherNewSubject, { brandName: brand.name });
  const html = fillTemplate(m.teacherNewHtml, {
    senderName: escapeHtml(params.senderName),
    brandName: escapeHtml(brand.name),
    messagePreview: previewBlock(params.messagePreview),
    href,
  });
  await params.emailProvider.sendEmail({ to, subject, html });
}

export async function notifyPortalRecipientForStaffMessage(params: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
  recipientRole: "teacher" | "admin";
}): Promise<void> {
  const to = await authEmailForUserId(params.recipientId);
  if (!to) return;
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const dashboard =
    params.recipientRole === "admin" ? "dashboard/admin/messages" : "dashboard/teacher/messages";
  const href = `${origin}/${params.locale}/${dashboard}`;
  const dict = await getDictionary(params.locale);
  const m = dict.emailMessaging;
  const subject = fillTemplate(m.staffPortalNewSubject, { brandName: brand.name });
  const html = fillTemplate(m.staffPortalNewHtml, {
    senderName: escapeHtml(params.senderName),
    brandName: escapeHtml(brand.name),
    messagePreview: previewBlock(params.messagePreview),
    href,
    openLinkLabel: m.staffInboxOpenLink,
  });
  await params.emailProvider.sendEmail({ to, subject, html });
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
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const dashboard =
    params.recipientRole === "parent" ? "dashboard/parent/messages" : "dashboard/student/messages";
  const href = `${origin}/${params.locale}/${dashboard}`;
  const dict = await getDictionary(params.locale);
  const m = dict.emailMessaging;
  const subject = fillTemplate(m.staffPortalNewSubject, { brandName: brand.name });
  const html = fillTemplate(m.staffPortalNewHtml, {
    senderName: escapeHtml(params.senderName),
    brandName: escapeHtml(brand.name),
    messagePreview: previewBlock(params.messagePreview),
    href,
    openLinkLabel: m.portalOpenMessages,
  });
  await params.emailProvider.sendEmail({ to, subject, html });
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
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const href = `${origin}/${params.locale}/dashboard/student/messages`;
  const dict = await getDictionary(params.locale);
  const m = dict.emailMessaging;
  const subject = fillTemplate(m.replySubject, { brandName: brand.name });
  const html = fillTemplate(m.replyHtml, {
    teacherName: escapeHtml(params.teacherName),
    brandName: escapeHtml(brand.name),
    replyPreview: previewBlock(params.replyPreview),
    href,
    openLinkLabel: m.portalOpenMessages,
  });
  await params.emailProvider.sendEmail({ to, subject, html });
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
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const href = `${origin}/${params.locale}/dashboard/parent/messages`;
  const dict = await getDictionary(params.locale);
  const m = dict.emailMessaging;
  const subject = fillTemplate(m.replySubject, { brandName: brand.name });
  const html = fillTemplate(m.replyHtml, {
    teacherName: escapeHtml(params.teacherName),
    brandName: escapeHtml(brand.name),
    replyPreview: previewBlock(params.replyPreview),
    href,
    openLinkLabel: m.portalOpenMessages,
  });
  await params.emailProvider.sendEmail({ to, subject, html });
}
