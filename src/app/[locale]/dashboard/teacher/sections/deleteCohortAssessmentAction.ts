"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveGradingActorSession } from "@/lib/academics/resolveGradingActorSession";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditAcademicAction } from "@/lib/audit";

const uuid = z.string().uuid();

const deletePayload = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  cohortId: uuid,
  assessmentId: uuid,
});

export type DeleteCohortAssessmentActionState =
  | { ok: true }
  | { ok: false; code: "auth" | "validation" | "forbidden" | "save" };

/** Admin-only: removes the cohort exam and all enrollment grades (cascade). */
export async function deleteCohortAssessmentAction(
  _prev: DeleteCohortAssessmentActionState | null,
  formData: FormData,
): Promise<DeleteCohortAssessmentActionState> {
  try {
    const actor = await resolveGradingActorSession();
    if (!actor) return { ok: false, code: "auth" };
    if (!actor.isAdmin) return { ok: false, code: "forbidden" };
    const { supabase, user } = actor;

    const raw = formData.get("payload");
    const parsed = deletePayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("cohort_id")
      .eq("id", p.sectionId)
      .maybeSingle();
    if (sErr || !sec || (sec as { cohort_id: string }).cohort_id !== p.cohortId) {
      return { ok: false, code: "forbidden" };
    }

    const { data: asmt, error: aErr } = await supabase
      .from("cohort_assessments")
      .select("id, name, cohort_id")
      .eq("id", p.assessmentId)
      .maybeSingle();
    if (aErr || !asmt || (asmt as { cohort_id: string }).cohort_id !== p.cohortId) {
      return { ok: false, code: "forbidden" };
    }

    const { error: delErr } = await supabase.from("cohort_assessments").delete().eq("id", p.assessmentId);
    if (delErr) return { ok: false, code: "save" };

    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: "delete",
      resourceType: "cohort_assessment",
      resourceId: p.assessmentId,
      summary: "Admin deleted cohort assessment",
      beforeValues: {
        id: p.assessmentId,
        cohort_id: p.cohortId,
        name: (asmt as { name: string }).name,
      },
    });

    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/assessments`);
    revalidatePath(`/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}`);
    return { ok: true };
  } catch (err) {
    logServerException("deleteCohortAssessmentAction", err);
    return { ok: false, code: "auth" };
  }
}
