"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import type { Locale } from "@/types/i18n";
import { loadRubricDimensionsForCohort } from "@/lib/academics/loadRubricDimensionsForCohort";
import { persistTeacherAssessmentGrade, type TeacherAssessmentGradePayload } from "@/lib/academics/persistTeacherAssessmentGrade";
import { sendGradePublishedParentEmails } from "@/lib/academics/sendGradePublishedParentEmails";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { RubricDimensionDef } from "@/types/rubricDimensions";

const uuid = z.string().uuid();

const jsonPayload = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  assessmentId: uuid,
  enrollmentId: uuid,
  score: z.coerce.number().min(0).max(100),
  rubric: z.record(z.string(), z.coerce.number()),
  teacherFeedback: z.string().max(8000).optional().nullable(),
});

export type UpsertGradeActionState =
  | { ok: true }
  | { ok: false; code: "auth" | "validation" | "forbidden" | "save" | "score_cap" };

function rubricSchemaForDimensions(dimensions: RubricDimensionDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const d of dimensions) {
    shape[d.key] = z.coerce.number().min(d.scaleMin).max(d.scaleMax);
  }
  return z.object(shape).strict();
}

function mapPersistCode(
  c: "ok" | "validation" | "forbidden" | "save" | "score_cap",
): UpsertGradeActionState {
  if (c === "ok") return { ok: true };
  if (c === "validation") return { ok: false, code: "validation" };
  if (c === "score_cap") return { ok: false, code: "score_cap" };
  if (c === "forbidden") return { ok: false, code: "forbidden" };
  return { ok: false, code: "save" };
}

async function teacherSectionCohortId(
  supabase: Awaited<ReturnType<typeof assertTeacher>>["supabase"],
  teacherId: string,
  sectionId: string,
): Promise<string | null> {
  const ok = await userIsSectionTeacherOrAssistant(supabase, teacherId, sectionId);
  if (!ok) return null;
  const { data } = await supabase.from("academic_sections").select("cohort_id").eq("id", sectionId).maybeSingle();
  return data ? (data as { cohort_id: string }).cohort_id : null;
}

async function parseGradePayload(
  formData: FormData,
  dimensions: RubricDimensionDef[],
): Promise<TeacherAssessmentGradePayload | null> {
  const raw = formData.get("payload");
  const base = jsonPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
  if (!base.success) return null;
  const rubricParsed = rubricSchemaForDimensions(dimensions).safeParse(base.data.rubric);
  if (!rubricParsed.success) return null;
  return {
    locale: base.data.locale,
    sectionId: base.data.sectionId,
    assessmentId: base.data.assessmentId,
    enrollmentId: base.data.enrollmentId,
    score: base.data.score,
    rubric: rubricParsed.data as Record<string, number>,
    teacherFeedback: base.data.teacherFeedback?.trim() ? base.data.teacherFeedback.trim() : null,
  };
}

function revalidateGradePaths(p: TeacherAssessmentGradePayload) {
  revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments/${p.assessmentId}`);
  revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
  revalidatePath(`/${p.locale}/dashboard/parent`);
  revalidatePath(`/${p.locale}/dashboard/student`);
}

export async function upsertGradeAction(
  _prev: UpsertGradeActionState | null,
  formData: FormData,
): Promise<UpsertGradeActionState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const statusParsed = z.enum(["draft", "published"]).safeParse(formData.get("gradeStatus"));
    if (!statusParsed.success) return { ok: false, code: "validation" };
    const status = statusParsed.data;

    const raw = formData.get("payload");
    const baseOnly = jsonPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!baseOnly.success) return { ok: false, code: "validation" };

    const cohortId = await teacherSectionCohortId(supabase, profileId, baseOnly.data.sectionId);
    if (!cohortId) return { ok: false, code: "forbidden" };

    const loc: Locale = baseOnly.data.locale === "es" ? "es" : "en";
    const dict = await getDictionary(loc);
    const criteria = dict.dashboard.teacherAssessmentMatrix.rubric.criteria as unknown as Record<string, string>;
    const dimensions = await loadRubricDimensionsForCohort(supabase, cohortId, criteria);

    const p = await parseGradePayload(formData, dimensions);
    if (!p) return { ok: false, code: "validation" };

    const code = await persistTeacherAssessmentGrade(supabase, profileId, cohortId, p, status, dimensions);
    const out = mapPersistCode(code);
    if (out.ok) revalidateGradePaths(p);
    return out;
  } catch (err) {
    logServerException("upsertGradeAction", err);
    return { ok: false, code: "auth" };
  }
}

/**
 * Persists the grade as **published** and emails linked parents/tutors (best-effort) with rubric detail.
 */
export async function publishGradeWithNotification(formData: FormData): Promise<UpsertGradeActionState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const rawProbe = formData.get("payload");
    const baseProbe = jsonPayload.safeParse(JSON.parse(typeof rawProbe === "string" ? rawProbe : "{}"));
    if (!baseProbe.success) return { ok: false, code: "validation" };
    const pre = baseProbe.data;

    const cohortId = await teacherSectionCohortId(supabase, profileId, pre.sectionId);
    if (!cohortId) return { ok: false, code: "forbidden" };

    const loc: Locale = pre.locale === "es" ? "es" : "en";
    const dict = await getDictionary(loc);
    const criteria = dict.dashboard.teacherAssessmentMatrix.rubric.criteria as unknown as Record<string, string>;
    const dimensions = await loadRubricDimensionsForCohort(supabase, cohortId, criteria);

    const p = await parseGradePayload(formData, dimensions);
    if (!p) return { ok: false, code: "validation" };

    const code = await persistTeacherAssessmentGrade(supabase, profileId, cohortId, p, "published", dimensions);
    const out = mapPersistCode(code);
    if (!out.ok) return out;

    revalidateGradePaths(p);

    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("student_id")
      .eq("id", p.enrollmentId)
      .maybeSingle();
    const studentId = enr ? (enr as { student_id: string }).student_id : null;

    const { data: asmt } = await supabase
      .from("cohort_assessments")
      .select("name, max_score")
      .eq("id", p.assessmentId)
      .maybeSingle();
    const assessmentName = asmt ? String((asmt as { name: string }).name) : p.assessmentId;
    const maxScore = asmt ? Number((asmt as { max_score: number }).max_score) : 0;

    if (studentId) {
      const emailCopy = dict.dashboard.emails.gradePublishedParent;
      const labelByRubricKey = Object.fromEntries(dimensions.map((d) => [d.key, d.label]));
      try {
        await sendGradePublishedParentEmails({
          supabase,
          studentId,
          locale: loc,
          copy: emailCopy,
          assessmentName,
          score: p.score,
          maxScore: Number.isFinite(maxScore) ? maxScore : p.score,
          rubricData: p.rubric,
          labelByRubricKey,
          teacherFeedback: p.teacherFeedback,
        });
      } catch (emailErr) {
        logServerException("publishGradeWithNotification:sendGradePublishedParentEmails", emailErr, {
          studentId,
        });
      }
    }

    return { ok: true };
  } catch (err) {
    logServerException("publishGradeWithNotification", err);
    return { ok: false, code: "auth" };
  }
}

const createPayload = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  name: z.string().min(1).max(200),
  assessmentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxScore: z.coerce.number().min(1).max(100),
});

export type CreateAssessmentActionState =
  | { ok: true; assessmentId: string }
  | { ok: false; code: "auth" | "validation" | "forbidden" | "save" };

export async function createCohortAssessmentAction(
  _prev: CreateAssessmentActionState | null,
  formData: FormData,
): Promise<CreateAssessmentActionState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = createPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const allowed = await userIsSectionTeacherOrAssistant(supabase, profileId, p.sectionId);
    if (!allowed) return { ok: false, code: "forbidden" };
    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("cohort_id")
      .eq("id", p.sectionId)
      .maybeSingle();
    if (sErr || !sec) return { ok: false, code: "forbidden" };

    const { data: inserted, error } = await supabase
      .from("cohort_assessments")
      .insert({
        cohort_id: sec.cohort_id as string,
        name: p.name.trim(),
        assessment_on: p.assessmentOn,
        max_score: p.maxScore,
      })
      .select("id")
      .maybeSingle();
    if (error || !inserted) return { ok: false, code: "save" };

    const id = (inserted as { id: string }).id;
    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
    return { ok: true, assessmentId: id };
  } catch (err) {
    logServerException("createCohortAssessmentAction", err);
    return { ok: false, code: "auth" };
  }
}
