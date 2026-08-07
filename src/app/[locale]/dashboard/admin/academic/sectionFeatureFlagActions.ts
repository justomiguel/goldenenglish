"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  canDisableRequiresEvaluations,
  canDisableUsesLearningRoute,
  type SectionFeatureFlagDisableCode,
} from "@/lib/academics/sectionFeatureFlagGuards";
import {
  logServerActionException,
  logServerActionInvariantViolation,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();

const inputSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  requiresEvaluationsToPass: z.boolean(),
  usesLearningRoute: z.boolean(),
});

export type UpdateSectionFeatureFlagsCode =
  | "PARSE"
  | "SAVE"
  | SectionFeatureFlagDisableCode;

const S = "updateAcademicSectionFeatureFlagsAction" as const;

export async function updateAcademicSectionFeatureFlagsAction(input: {
  locale: string;
  sectionId: string;
  requiresEvaluationsToPass: boolean;
  usesLearningRoute: boolean;
}): Promise<{ ok: true } | { ok: false; code: UpdateSectionFeatureFlagsCode }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: secErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, requires_evaluations_to_pass, uses_learning_route")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (secErr || !sec) {
      if (secErr) logSupabaseClientError(`${S}:section`, secErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }
    const section = sec as {
      id: string;
      cohort_id: string;
      requires_evaluations_to_pass: boolean;
      uses_learning_route: boolean;
    };

    if (
      section.requires_evaluations_to_pass === true &&
      data.requiresEvaluationsToPass === false
    ) {
      const { count, error: countErr } = await supabase
        .from("learning_assessments")
        .select("id", { count: "exact", head: true })
        .eq("section_id", data.sectionId);
      if (countErr) {
        logSupabaseClientError(`${S}:assessmentCount`, countErr, { sectionId: data.sectionId });
        return { ok: false, code: "SAVE" };
      }
      const guard = canDisableRequiresEvaluations({ assessmentCount: count ?? 0 });
      if (!guard.ok) return guard;
    }

    if (section.uses_learning_route === true && data.usesLearningRoute === false) {
      const { data: routeRow, error: routeErr } = await supabase
        .from("section_learning_routes")
        .select("mode")
        .eq("section_id", data.sectionId)
        .maybeSingle();
      if (routeErr) {
        logSupabaseClientError(`${S}:learningRoute`, routeErr, { sectionId: data.sectionId });
        return { ok: false, code: "SAVE" };
      }
      const mode = (routeRow as { mode?: "route" | "free_flow" } | null)?.mode ?? null;
      const guard = canDisableUsesLearningRoute({ learningRouteMode: mode });
      if (!guard.ok) return guard;
    }

    const { data: updated, error: upErr } = await supabase
      .from("academic_sections")
      .update({
        requires_evaluations_to_pass: data.requiresEvaluationsToPass,
        uses_learning_route: data.usesLearningRoute,
      })
      .eq("id", data.sectionId)
      .select("id")
      .maybeSingle();
    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }
    if (!updated) {
      logServerActionInvariantViolation(S, "update_matched_zero_rows", {
        sectionId: data.sectionId,
      });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_feature_flags_updated",
      resourceType: "academic_section",
      resourceId: data.sectionId,
      payload: {
        cohort_id: section.cohort_id,
        requires_evaluations_to_pass: data.requiresEvaluationsToPass,
        uses_learning_route: data.usesLearningRoute,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(
      `/${data.locale}/dashboard/admin/academic/${section.cohort_id}/${data.sectionId}`,
      "page",
    );
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}
