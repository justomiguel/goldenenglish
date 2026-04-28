"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditAcademicAction } from "@/lib/audit";
import { isProposedCohortAssessmentMaxScoreAllowed } from "@/lib/academics/isProposedCohortAssessmentMaxScoreAllowed";
import { resolveGradingActorSession } from "@/lib/academics/resolveGradingActorSession";
import { teacherSectionCohortId } from "@/lib/academics/teacherAssessmentGradeActionsSupport";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { AuditJsonObject } from "@/lib/audit/types";

const uuid = z.string().uuid();

const updatePayload = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  cohortId: uuid,
  assessmentId: uuid,
  name: z
    .string()
    .max(200)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: "name_empty" }),
  assessmentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxScore: z.coerce.number().min(1).max(100),
});

export type UpdateCohortAssessmentActionState =
  | { ok: true }
  | {
      ok: false;
      code: "auth" | "validation" | "forbidden" | "save" | "max_score_below_grades" | "rpc";
    };

function rowToAuditSnapshot(row: {
  id: string;
  cohort_id: string;
  name: string;
  assessment_on: string;
  max_score: number | string;
  created_at: string;
}): AuditJsonObject {
  return {
    id: row.id,
    cohort_id: row.cohort_id,
    name: row.name,
    assessment_on: row.assessment_on,
    max_score: Number(row.max_score),
    created_at: row.created_at,
  };
}

export async function updateCohortAssessmentAction(
  _prev: UpdateCohortAssessmentActionState | null,
  formData: FormData,
): Promise<UpdateCohortAssessmentActionState> {
  try {
    const actor = await resolveGradingActorSession();
    if (!actor) return { ok: false, code: "auth" };
    const { supabase, profileId, user, isAdmin } = actor;

    const raw = formData.get("payload");
    const parsed = updatePayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const cohortOk = await teacherSectionCohortId(supabase, profileId, p.sectionId);
    if (!cohortOk || cohortOk !== p.cohortId) return { ok: false, code: "forbidden" };

    const { data: existing, error: exErr } = await supabase
      .from("cohort_assessments")
      .select("id, cohort_id, name, assessment_on, max_score, created_at")
      .eq("id", p.assessmentId)
      .maybeSingle();
    if (exErr || !existing) return { ok: false, code: "forbidden" };
    const ex = existing as {
      id: string;
      cohort_id: string;
      name: string;
      assessment_on: string;
      max_score: number | string;
      created_at: string;
    };
    if (ex.cohort_id !== p.cohortId) return { ok: false, code: "forbidden" };

    const { data: maxGradeRaw, error: rpcErr } = await supabase.rpc("max_enrollment_assessment_grade_score", {
      p_assessment_id: p.assessmentId,
    });
    if (rpcErr) return { ok: false, code: "rpc" };
    const maxExisting = maxGradeRaw == null ? 0 : Number(maxGradeRaw);
    if (!isProposedCohortAssessmentMaxScoreAllowed(p.maxScore, maxExisting)) {
      return { ok: false, code: "max_score_below_grades" };
    }

    const beforeSnapshot = rowToAuditSnapshot(ex);

    const { error: upErr } = await supabase
      .from("cohort_assessments")
      .update({
        name: p.name,
        assessment_on: p.assessmentOn,
        max_score: p.maxScore,
      })
      .eq("id", p.assessmentId);
    if (upErr) return { ok: false, code: "save" };

    const afterSnapshot: AuditJsonObject = {
      ...beforeSnapshot,
      name: p.name,
      assessment_on: p.assessmentOn,
      max_score: p.maxScore,
    };

    void auditAcademicAction({
      actorId: user.id,
      actorRole: isAdmin ? "admin" : "teacher",
      action: "update",
      resourceType: "cohort_assessment",
      resourceId: p.assessmentId,
      summary: isAdmin ? "Admin updated cohort assessment" : "Teacher updated cohort assessment",
      beforeValues: beforeSnapshot,
      afterValues: afterSnapshot,
    });

    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments/${p.assessmentId}`);
    revalidatePath(`/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}`);
    return { ok: true };
  } catch (err) {
    logServerException("updateCohortAssessmentAction", err);
    return { ok: false, code: "auth" };
  }
}
