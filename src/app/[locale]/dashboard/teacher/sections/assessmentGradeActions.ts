"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Locale } from "@/types/i18n";
import { loadRubricDimensionsForCohort } from "@/lib/academics/loadRubricDimensionsForCohort";
import { persistTeacherAssessmentGrade } from "@/lib/academics/persistTeacherAssessmentGrade";
import { resolveGradingActorSession } from "@/lib/academics/resolveGradingActorSession";
import { sendGradePublishedParentEmails } from "@/lib/academics/sendGradePublishedParentEmails";
import {
  gradeAuditRole,
  mapPersistCodeToUpsertState,
  parseTeacherGradePayload,
  revalidateTeacherGradePaths,
  teacherGradeJsonPayload,
  teacherSectionCohortId,
  type UpsertGradeActionState,
} from "@/lib/academics/teacherAssessmentGradeActionsSupport";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditAcademicAction, auditSectionAction } from "@/lib/audit";

const uuid = z.string().uuid();

export type { UpsertGradeActionState };

export async function upsertGradeAction(
  _prev: UpsertGradeActionState | null,
  formData: FormData,
): Promise<UpsertGradeActionState> {
  try {
    const actor = await resolveGradingActorSession();
    if (!actor) return { ok: false, code: "auth" };
    const { supabase, profileId, user, isAdmin } = actor;
    const statusParsed = z.enum(["draft", "published"]).safeParse(formData.get("gradeStatus"));
    if (!statusParsed.success) return { ok: false, code: "validation" };
    const status = statusParsed.data;

    const raw = formData.get("payload");
    const baseOnly = teacherGradeJsonPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!baseOnly.success) return { ok: false, code: "validation" };

    const cohortId = await teacherSectionCohortId(supabase, profileId, baseOnly.data.sectionId);
    if (!cohortId) return { ok: false, code: "forbidden" };

    const loc: Locale = baseOnly.data.locale === "es" ? "es" : "en";
    const dict = await getDictionary(loc);
    const criteria = dict.dashboard.teacherAssessmentMatrix.rubric.criteria as unknown as Record<string, string>;
    const dimensions = await loadRubricDimensionsForCohort(supabase, cohortId, criteria);

    const p = await parseTeacherGradePayload(formData, dimensions);
    if (!p) return { ok: false, code: "validation" };

    const code = await persistTeacherAssessmentGrade(supabase, profileId, cohortId, p, status, dimensions);
    const out = mapPersistCodeToUpsertState(code);
    if (out.ok) {
      const role = gradeAuditRole(isAdmin);
      void auditSectionAction({
        actorId: user.id,
        actorRole: role,
        action: "update",
        resourceType: "assessment_grade",
        resourceId: p.enrollmentId,
        summary: `${isAdmin ? "Admin" : "Teacher"} saved ${status} assessment grade`,
        afterValues: {
          section_id: p.sectionId,
          assessment_id: p.assessmentId,
          enrollment_id: p.enrollmentId,
          score: p.score,
          rubric: p.rubric,
          status,
        },
        metadata: { feedback_present: Boolean(p.teacherFeedback) },
      });
      revalidateTeacherGradePaths(p, cohortId);
    }
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
    const actor = await resolveGradingActorSession();
    if (!actor) return { ok: false, code: "auth" };
    const { supabase, profileId, user, isAdmin } = actor;
    const rawProbe = formData.get("payload");
    const baseProbe = teacherGradeJsonPayload.safeParse(JSON.parse(typeof rawProbe === "string" ? rawProbe : "{}"));
    if (!baseProbe.success) return { ok: false, code: "validation" };
    const pre = baseProbe.data;

    const cohortId = await teacherSectionCohortId(supabase, profileId, pre.sectionId);
    if (!cohortId) return { ok: false, code: "forbidden" };

    const loc: Locale = pre.locale === "es" ? "es" : "en";
    const dict = await getDictionary(loc);
    const criteria = dict.dashboard.teacherAssessmentMatrix.rubric.criteria as unknown as Record<string, string>;
    const dimensions = await loadRubricDimensionsForCohort(supabase, cohortId, criteria);

    const p = await parseTeacherGradePayload(formData, dimensions);
    if (!p) return { ok: false, code: "validation" };

    const code = await persistTeacherAssessmentGrade(supabase, profileId, cohortId, p, "published", dimensions);
    const out = mapPersistCodeToUpsertState(code);
    if (!out.ok) return out;
    void auditSectionAction({
      actorId: user.id,
      actorRole: gradeAuditRole(isAdmin),
      action: "publish",
      resourceType: "assessment_grade",
      resourceId: p.enrollmentId,
      summary: isAdmin ? "Admin published assessment grade" : "Teacher published assessment grade",
      afterValues: {
        section_id: p.sectionId,
        assessment_id: p.assessmentId,
        enrollment_id: p.enrollmentId,
        score: p.score,
        rubric: p.rubric,
      },
      metadata: { feedback_present: Boolean(p.teacherFeedback) },
    });

    revalidateTeacherGradePaths(p, cohortId);

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
    const actor = await resolveGradingActorSession();
    if (!actor) return { ok: false, code: "auth" };
    const { supabase, profileId, user, isAdmin } = actor;
    const raw = formData.get("payload");
    const parsed = createPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const staff = await userIsSectionTeacherOrAssistant(supabase, profileId, p.sectionId);
    if (!staff && !isAdmin) return { ok: false, code: "forbidden" };
    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("cohort_id")
      .eq("id", p.sectionId)
      .maybeSingle();
    if (sErr || !sec) return { ok: false, code: "forbidden" };

    const cohortId = sec.cohort_id as string;
    const { data: inserted, error } = await supabase
      .from("cohort_assessments")
      .insert({
        cohort_id: cohortId,
        name: p.name.trim(),
        assessment_on: p.assessmentOn,
        max_score: p.maxScore,
      })
      .select("id")
      .maybeSingle();
    if (error || !inserted) return { ok: false, code: "save" };

    const id = (inserted as { id: string }).id;
    void auditAcademicAction({
      actorId: user.id,
      actorRole: gradeAuditRole(isAdmin),
      action: "create",
      resourceType: "cohort_assessment",
      resourceId: id,
      summary: isAdmin ? "Admin created cohort assessment" : "Teacher created cohort assessment",
      afterValues: {
        id,
        cohort_id: cohortId,
        section_id: p.sectionId,
        name: p.name.trim(),
        assessment_on: p.assessmentOn,
        max_score: p.maxScore,
      },
    });
    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
    revalidatePath(`/${p.locale}/dashboard/admin/academic/${cohortId}/${p.sectionId}`);
    return { ok: true, assessmentId: id };
  } catch (err) {
    logServerException("createCohortAssessmentAction", err);
    return { ok: false, code: "auth" };
  }
}
