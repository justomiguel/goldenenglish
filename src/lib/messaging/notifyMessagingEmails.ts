import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandPublic } from "@/lib/brand/server";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

async function authEmailForUserId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export async function notifyTeacherNewMessage(params: {
  teacherId: string;
  studentName: string;
  messagePreview: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<void> {
  const to = await authEmailForUserId(params.teacherId);
  if (!to) return;
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const href = `${origin}/${params.locale}/dashboard/teacher/messages`;
  const html = `
    <p>New message from <strong>${escapeHtml(params.studentName)}</strong> at ${escapeHtml(brand.name)}.</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;">${params.messagePreview.slice(0, 500)}</blockquote>
    <p><a href="${href}">Open teacher inbox</a></p>
  `;
  await params.emailProvider.sendEmail({
    to,
    subject: `${brand.name} — New student message`,
    html,
  });
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
  const html = `
    <p>New message from <strong>${escapeHtml(params.senderName)}</strong> at ${escapeHtml(brand.name)}.</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;">${params.messagePreview.slice(0, 500)}</blockquote>
    <p><a href="${href}">Open inbox</a></p>
  `;
  await params.emailProvider.sendEmail({
    to,
    subject: `${brand.name} — New message`,
    html,
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
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const href = `${origin}/${params.locale}/dashboard/student/messages`;
  const html = `
    <p><strong>${escapeHtml(params.teacherName)}</strong> replied to your message at ${escapeHtml(brand.name)}.</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;">${params.replyPreview.slice(0, 500)}</blockquote>
    <p><a href="${href}">Open messages</a></p>
  `;
  await params.emailProvider.sendEmail({
    to,
    subject: `${brand.name} — Reply to your message`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
