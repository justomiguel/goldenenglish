import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherAssessmentGradePayload } from "@/lib/academics/persistTeacherAssessmentGrade";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import type { RubricDimensionDef } from "@/types/rubricDimensions";

const uuid = z.string().uuid();

export const teacherGradeJsonPayload = z.object({
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

export function gradeAuditRole(isAdmin: boolean): "admin" | "teacher" {
  return isAdmin ? "admin" : "teacher";
}

export function rubricSchemaForDimensions(dimensions: RubricDimensionDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const d of dimensions) {
    shape[d.key] = z.coerce.number().min(d.scaleMin).max(d.scaleMax);
  }
  return z.object(shape).strict();
}

export function mapPersistCodeToUpsertState(
  c: "ok" | "validation" | "forbidden" | "save" | "score_cap",
): UpsertGradeActionState {
  if (c === "ok") return { ok: true };
  if (c === "validation") return { ok: false, code: "validation" };
  if (c === "score_cap") return { ok: false, code: "score_cap" };
  if (c === "forbidden") return { ok: false, code: "forbidden" };
  return { ok: false, code: "save" };
}

/** Cohort for rubric exams: section lead/assistant, or admin for any section. */
export async function teacherSectionCohortId(
  supabase: SupabaseClient,
  userId: string,
  sectionId: string,
): Promise<string | null> {
  const { data } = await supabase.from("academic_sections").select("cohort_id").eq("id", sectionId).maybeSingle();
  if (!data) return null;
  const cohortId = (data as { cohort_id: string }).cohort_id;
  if (await userIsSectionTeacherOrAssistant(supabase, userId, sectionId)) return cohortId;
  if (await resolveIsAdminSession(supabase, userId)) return cohortId;
  return null;
}

export async function parseTeacherGradePayload(
  formData: FormData,
  dimensions: RubricDimensionDef[],
): Promise<TeacherAssessmentGradePayload | null> {
  const raw = formData.get("payload");
  const base = teacherGradeJsonPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
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

export function revalidateTeacherGradePaths(p: TeacherAssessmentGradePayload, cohortId: string) {
  revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments/${p.assessmentId}`);
  revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
  revalidatePath(`/${p.locale}/dashboard/admin/academic/${cohortId}/${p.sectionId}`);
  revalidatePath(`/${p.locale}/dashboard/parent`);
  revalidatePath(`/${p.locale}/dashboard/student`);
}
