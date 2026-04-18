"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import {
  isSectionFeePlanInUse,
  loadSectionCohortId,
} from "@/lib/billing/sectionFeePlanLifecycle";

export type SectionFeePlanLifecycleCode = "PARSE" | "FORBIDDEN" | "SAVE" | "IN_USE";

const lifecycleSchema = z.object({
  locale: z.string().min(1),
  sectionId: z.string().uuid(),
  planId: z.string().uuid(),
});

type LifecycleInput = z.infer<typeof lifecycleSchema>;
type AdminContext = Awaited<ReturnType<typeof assertAdmin>>;
type LifecycleResult = { ok: true } | { ok: false; code: SectionFeePlanLifecycleCode };

interface LifecycleConfig {
  scope: string;
  auditAction: "section_fee_plan_deleted" | "section_fee_plan_archived" | "section_fee_plan_restored";
  apply: (
    supabase: AdminContext["supabase"],
    user: AdminContext["user"],
    data: LifecycleInput,
  ) => Promise<LifecycleResult>;
}

function revalidatePlanSurfaces(locale: string, sectionId: string, cohortId: string | null) {
  revalidateAcademicSurfaces(locale);
  if (cohortId) {
    revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`, "page");
  }
  revalidatePath(`/${locale}/dashboard/student/payments`, "page");
}

async function runLifecycle(
  input: { locale: string; sectionId: string; planId: string },
  cfg: LifecycleConfig,
): Promise<LifecycleResult> {
  const parsed = lifecycleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;
  try {
    const { supabase, user } = await assertAdmin();
    const cohortId = await loadSectionCohortId(supabase, data.sectionId);
    const result = await cfg.apply(supabase, user, data);
    if (!result.ok) return result;
    void recordSystemAudit({
      action: cfg.auditAction,
      resourceType: "section_fee_plan",
      resourceId: data.planId,
      payload: { section_id: data.sectionId, cohort_id: cohortId ?? null },
    });
    revalidatePlanSurfaces(data.locale, data.sectionId, cohortId);
    return { ok: true };
  } catch (err) {
    logServerActionException(cfg.scope, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}

export async function deleteSectionFeePlanAction(input: {
  locale: string;
  sectionId: string;
  planId: string;
}): Promise<LifecycleResult> {
  const scope = "deleteSectionFeePlanAction";
  return runLifecycle(input, {
    scope,
    auditAction: "section_fee_plan_deleted",
    apply: async (supabase, _user, data) => {
      // Defense in depth: the UI hides the hard-delete button when payments
      // already reference this plan, but never trust the client.
      if (await isSectionFeePlanInUse(supabase, data.sectionId, data.planId)) {
        return { ok: false, code: "IN_USE" };
      }
      const { error } = await supabase
        .from("section_fee_plans")
        .delete()
        .eq("id", data.planId)
        .eq("section_id", data.sectionId);
      if (error) {
        logSupabaseClientError(`${scope}:delete`, error, { planId: data.planId });
        return { ok: false, code: "SAVE" };
      }
      return { ok: true };
    },
  });
}

export async function archiveSectionFeePlanAction(input: {
  locale: string;
  sectionId: string;
  planId: string;
}): Promise<LifecycleResult> {
  const scope = "archiveSectionFeePlanAction";
  return runLifecycle(input, {
    scope,
    auditAction: "section_fee_plan_archived",
    apply: async (supabase, user, data) => {
      const { error } = await supabase
        .from("section_fee_plans")
        .update({ archived_at: new Date().toISOString(), archived_by: user.id })
        .eq("id", data.planId)
        .eq("section_id", data.sectionId);
      if (error) {
        logSupabaseClientError(`${scope}:update`, error, { planId: data.planId });
        return { ok: false, code: "SAVE" };
      }
      return { ok: true };
    },
  });
}

export async function restoreSectionFeePlanAction(input: {
  locale: string;
  sectionId: string;
  planId: string;
}): Promise<LifecycleResult> {
  const scope = "restoreSectionFeePlanAction";
  return runLifecycle(input, {
    scope,
    auditAction: "section_fee_plan_restored",
    apply: async (supabase, _user, data) => {
      const { error } = await supabase
        .from("section_fee_plans")
        .update({ archived_at: null, archived_by: null })
        .eq("id", data.planId)
        .eq("section_id", data.sectionId);
      if (error) {
        logSupabaseClientError(`${scope}:update`, error, { planId: data.planId });
        return { ok: false, code: "SAVE" };
      }
      return { ok: true };
    },
  });
}
