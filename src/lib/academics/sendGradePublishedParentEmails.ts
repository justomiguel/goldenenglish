import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import { getBrandPublic } from "@/lib/brand/server";
import { absoluteUrl } from "@/lib/site/publicUrl";

export type GradePublishedEmailCopy = {
  subject: string;
  headline: string;
  intro: string;
  scoreLineLabel: string;
  rubricTableTitle: string;
  rubricColumnCriterion: string;
  rubricColumnScore: string;
  feedbackTitle: string;
  portalCta: string;
};

function buildHtml(input: {
  brandName: string;
  copy: GradePublishedEmailCopy;
  studentLabel: string;
  assessmentName: string;
  scoreText: string;
  rubricRows: { label: string; value: string }[];
  feedbackHtml: string | null;
  portalHref: string | null;
}): string {
  const rubricList =
    input.rubricRows.length === 0
      ? `<p><em>${escapeHtml(input.copy.rubricTableTitle)}</em></p>`
      : `<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;width:100%;max-width:480px">
          <caption style="text-align:left;font-weight:600;margin-bottom:0.5rem">${escapeHtml(input.copy.rubricTableTitle)}</caption>
          <thead><tr><th align="left">${escapeHtml(input.copy.rubricColumnCriterion)}</th><th align="left">${escapeHtml(input.copy.rubricColumnScore)}</th></tr></thead>
          <tbody>
            ${input.rubricRows.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.value)}</td></tr>`).join("")}
          </tbody>
        </table>`;

  const feedbackBlock = input.feedbackHtml
    ? `<h3 style="margin-top:1.25rem">${escapeHtml(input.copy.feedbackTitle)}</h3><p>${input.feedbackHtml}</p>`
    : "";

  const cta =
    input.portalHref != null
      ? `<p style="margin-top:1.5rem"><a href="${escapeHtml(input.portalHref)}">${escapeHtml(input.copy.portalCta)}</a></p>`
      : "";

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
    <h1 style="color:#333">${escapeHtml(input.copy.headline)}</h1>
    <p>${escapeHtml(input.copy.intro)}</p>
    <ul>
      <li><strong>${escapeHtml(input.studentLabel)}</strong></li>
      <li>${escapeHtml(input.assessmentName)}</li>
      <li>${escapeHtml(input.copy.scoreLineLabel)} ${escapeHtml(input.scoreText)}</li>
    </ul>
    ${rubricList}
    ${feedbackBlock}
    ${cta}
    <p style="margin-top:2rem;font-size:12px;color:#666">${escapeHtml(input.brandName)}</p>
  </body></html>`;
}

/** Best-effort: notifies linked tutors/parents via login email. */
export async function sendGradePublishedParentEmails(input: {
  supabase: SupabaseClient;
  emailProvider: EmailProvider;
  studentId: string;
  locale: string;
  copy: GradePublishedEmailCopy;
  assessmentName: string;
  score: number;
  maxScore: number;
  rubricData: Record<string, number>;
  labelByRubricKey: Record<string, string>;
  teacherFeedback: string | null;
}): Promise<void> {
  const brand = getBrandPublic();
  const admin = createAdminClient();

  const { data: studentProfile } = await input.supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", input.studentId)
    .maybeSingle();

  const studentLabel = studentProfile
    ? `${(studentProfile as { first_name: string }).first_name} ${(studentProfile as { last_name: string }).last_name}`.trim()
    : input.studentId;

  const rubricRows = Object.entries(input.rubricData).map(([key, val]) => ({
    label: input.labelByRubricKey[key] ?? key,
    value: String(val),
  }));

  const scoreText = `${input.score} / ${input.maxScore}`;
  const portal = absoluteUrl(`/${input.locale}/dashboard/parent`);
  const portalHref = portal?.toString() ?? null;

  const feedbackSafe = input.teacherFeedback?.trim()
    ? escapeHtml(input.teacherFeedback.trim()).replace(/\n/g, "<br/>")
    : null;

  const html = buildHtml({
    brandName: brand.name,
    copy: input.copy,
    studentLabel,
    assessmentName: input.assessmentName,
    scoreText,
    rubricRows,
    feedbackHtml: feedbackSafe,
    portalHref,
  });

  const { data: tutorLinks } = await input.supabase
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", input.studentId);

  for (const row of tutorLinks ?? []) {
    const tutorId = (row as { tutor_id: string }).tutor_id;
    const { data: authTutor } = await admin.auth.admin.getUserById(tutorId);
    const to = authTutor.user?.email;
    if (!to) continue;
    await input.emailProvider.sendEmail({
      to,
      subject: input.copy.subject,
      html,
    });
  }
}
