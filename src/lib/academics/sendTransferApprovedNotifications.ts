import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandPublic } from "@/lib/brand/server";
import { escapeHtml } from "@/lib/academics/escapeHtml";

function formatSlots(slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  return slots
    .map(
      (s) =>
        `${s.dayOfWeek}: ${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}`,
    )
    .join("<br/>");
}

export async function sendTransferApprovedNotifications(input: {
  supabase: SupabaseClient;
  locale: "en" | "es";
  studentId: string;
  sectionName: string;
  cohortName: string;
  teacherName: string;
  scheduleSlots: { dayOfWeek: number; startTime: string; endTime: string }[];
  dict: {
    emailSubject: string;
    emailLead: string;
    inAppTitle: string;
    inAppBody: string;
  };
}): Promise<void> {
  const brand = getBrandPublic();
  const admin = createAdminClient();

  const { data: tutorLinks } = await input.supabase
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", input.studentId);

  const provider = getEmailProvider();
  const slotHtml = formatSlots(input.scheduleSlots);
  const htmlBody = `<p>${escapeHtml(input.dict.emailLead)}</p>
          <ul>
            <li><strong>${escapeHtml(brand.name)}</strong></li>
            <li>${escapeHtml(input.dict.inAppBody)}: ${escapeHtml(input.cohortName)} / ${escapeHtml(input.sectionName)}</li>
            <li>${escapeHtml(input.teacherName)}</li>
          </ul>
          <p>${slotHtml}</p>`;

  for (const row of tutorLinks ?? []) {
    const tutorId = (row as { tutor_id: string }).tutor_id;
    const { data: authTutor } = await admin.auth.admin.getUserById(tutorId);
    const to = authTutor.user?.email;
    if (to) {
      await provider.sendEmail({
        to,
        subject: input.dict.emailSubject,
        html: htmlBody,
      });
    }
  }

  const body = `<p><strong>${escapeHtml(input.dict.inAppTitle)}</strong></p>
    <p>${escapeHtml(input.dict.inAppBody)}: ${escapeHtml(input.cohortName)} — ${escapeHtml(input.sectionName)} (${escapeHtml(input.teacherName)})</p>
    <p>${formatSlots(input.scheduleSlots)}</p>`;

  const { data: adminSelf } = await input.supabase.auth.getUser();
  const sender = adminSelf.user?.id;
  if (!sender) return;

  await input.supabase.from("portal_messages").insert({
    sender_id: sender,
    recipient_id: input.studentId,
    body_html: body,
  });
}
