import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import type { Locale } from "@/types/i18n";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

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

function buildRubricRowsHtml(rows: { label: string; value: string }[]): string {
  if (rows.length === 0) return "";
  return rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.label)}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");
}

/** Best-effort: notifies linked tutors/parents via login email. */
export async function sendGradePublishedParentEmails(input: {
  supabase: SupabaseClient;
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
  const admin = createAdminClient();

  const { data: studentProfile } = await input.supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", input.studentId)
    .maybeSingle();

  const studentLabel = studentProfile
    ? formatProfileSnakeSurnameFirst(studentProfile as { first_name: string; last_name: string }, input.studentId)
    : input.studentId;

  const rubricRows = Object.entries(input.rubricData).map(([key, val]) => ({
    label: input.labelByRubricKey[key] ?? key,
    value: String(val),
  }));

  const scoreText = `${input.score} / ${input.maxScore}`;
  const portal = absoluteUrl(`/${input.locale}/dashboard/parent`);
  const portalHref = portal?.toString() ?? "";

  const feedbackHtml = input.teacherFeedback?.trim()
    ? `<h3 style="margin-top:0;">${escapeHtml(input.copy.feedbackTitle)}</h3><p>${escapeHtml(input.teacherFeedback.trim()).replace(/\n/g, "<br/>")}</p>`
    : "";

  const vars = {
    headline: escapeHtml(input.copy.headline),
    intro: escapeHtml(input.copy.intro),
    studentLabel: escapeHtml(studentLabel),
    assessmentName: escapeHtml(input.assessmentName),
    scoreText: escapeHtml(scoreText),
    rubricHtml: buildRubricRowsHtml(rubricRows),
    feedbackHtml,
    portalHref: escapeHtml(portalHref),
    portalCta: escapeHtml(input.copy.portalCta),
  };

  const { data: tutorLinks } = await input.supabase
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", input.studentId);

  for (const row of tutorLinks ?? []) {
    const tutorId = (row as { tutor_id: string }).tutor_id;
    const { data: authTutor } = await admin.auth.admin.getUserById(tutorId);
    const to = authTutor.user?.email;
    if (!to) continue;
    await sendBrandedEmail({
      to,
      templateKey: "academics.grade_published_parent",
      locale: (input.locale === "en" ? "en" : "es") as Locale,
      vars,
    });
  }
}
