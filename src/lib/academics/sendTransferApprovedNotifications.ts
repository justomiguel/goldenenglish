import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import type { Locale } from "@/types/i18n";

function formatScheduleHtml(slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  return slots
    .map(
      (s) =>
        `<li>${s.dayOfWeek}: ${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</li>`,
    )
    .join("");
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
  const admin = createAdminClient();

  const { data: tutorLinks } = await input.supabase
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", input.studentId);

  const scheduleHtml = formatScheduleHtml(input.scheduleSlots);
  const vars = {
    lead: escapeHtml(input.dict.emailLead),
    cohortName: escapeHtml(input.cohortName),
    sectionName: escapeHtml(input.sectionName),
    teacherName: escapeHtml(input.teacherName),
    scheduleHtml,
  };

  for (const row of tutorLinks ?? []) {
    const tutorId = (row as { tutor_id: string }).tutor_id;
    const { data: authTutor } = await admin.auth.admin.getUserById(tutorId);
    const to = authTutor.user?.email;
    if (to) {
      await sendBrandedEmail({
        to,
        templateKey: "academics.transfer_approved",
        locale: input.locale as Locale,
        vars,
      });
    }
  }

  const body = `<p><strong>${escapeHtml(input.dict.inAppTitle)}</strong></p>
    <p>${escapeHtml(input.dict.inAppBody)}: ${escapeHtml(input.cohortName)} — ${escapeHtml(input.sectionName)} (${escapeHtml(input.teacherName)})</p>
    <p>${formatScheduleHtml(input.scheduleSlots)}</p>`;

  const { data: adminSelf } = await input.supabase.auth.getUser();
  const sender = adminSelf.user?.id;
  if (!sender) return;

  await input.supabase.from("portal_messages").insert({
    sender_id: sender,
    recipient_id: input.studentId,
    body_html: body,
  });
}
