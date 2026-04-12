import { getBrandPublic } from "@/lib/brand/server";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types/i18n";

async function emailsForStudentParents(studentId: string): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }
  const out = new Set<string>();
  const { data: su } = await admin.auth.admin.getUserById(studentId);
  if (su.user?.email) out.add(su.user.email);
  const { data: links } = await admin
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", studentId);
  for (const row of links ?? []) {
    const { data: pu } = await admin.auth.admin.getUserById(row.tutor_id as string);
    if (pu.user?.email) out.add(pu.user.email);
  }
  return [...out];
}

export async function sendStudentChurnAlert(params: {
  studentId: string;
  locale: Locale;
  studentDisplayName: string;
}): Promise<void> {
  const toList = await emailsForStudentParents(params.studentId);
  if (toList.length === 0) return;
  const brand = getBrandPublic();
  const provider = getEmailProvider();
  const subject =
    params.locale === "en"
      ? `${brand.name}: we miss you on the portal`
      : `${brand.name}: te extrañamos en el portal`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#103A5C;">
<p><strong>${brand.name}</strong></p>
<p>${params.locale === "en" ? "Hello," : "Hola,"}</p>
<p>${params.locale === "en" ? "We noticed" : "Notamos"} <strong>${params.studentDisplayName}</strong> ${params.locale === "en" ? "has not opened the student portal recently. If you need help, contact us." : "no ha ingresado al portal del alumno recientemente. Si necesitás ayuda, escribinos."}</p>
<p style="font-size:0.875rem;color:#6B7280;">${brand.contactEmail}</p>
</body></html>`;

  for (const to of toList) {
    await provider.sendEmail({ to, subject, html });
  }
}
