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
  DEFAULT_SECTION_FEE_PLAN_CURRENCY,
} from "@/types/sectionFeePlan";

const uuid = z.string().uuid();

const monthSchema = z.coerce.number().int().min(1).max(12);
const yearSchema = z.coerce.number().int().min(2000).max(2100);
const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "currency_iso4217");

const upsertSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  planId: z.union([uuid, z.literal("")]).optional(),
  effectiveFromYear: yearSchema,
  effectiveFromMonth: monthSchema,
  monthlyFee: z.coerce.number().min(0),
  currency: currencySchema.default(DEFAULT_SECTION_FEE_PLAN_CURRENCY),
});

export type UpsertSectionFeePlanCode = "PARSE" | "FORBIDDEN" | "SAVE";

const S_UPSERT = "upsertSectionFeePlanAction" as const;

export async function upsertSectionFeePlanAction(input: {
  locale: string;
  sectionId: string;
  planId?: string;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  monthlyFee: number;
  currency: string;
}): Promise<{ ok: true; planId: string } | { ok: false; code: UpsertSectionFeePlanCode }> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;

  try {
    const { supabase, user } = await assertAdmin();

    const { data: sec, error: secErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (secErr || !sec) {
      if (secErr) logSupabaseClientError(`${S_UPSERT}:section`, secErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }
    const cohortId = (sec as { cohort_id: string }).cohort_id;

    const payload = {
      section_id: data.sectionId,
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
      monthly_fee: data.monthlyFee,
      currency: data.currency,
      updated_by: user.id,
    };

    let planId: string;
    if (data.planId && data.planId.length > 0) {
      const { error: upErr } = await supabase
        .from("section_fee_plans")
        .update(payload)
        .eq("id", data.planId)
        .eq("section_id", data.sectionId);
      if (upErr) {
        logSupabaseClientError(`${S_UPSERT}:update`, upErr, { planId: data.planId });
        return { ok: false, code: "SAVE" };
      }
      planId = data.planId;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("section_fee_plans")
        .insert(payload)
        .select("id")
        .single();
      if (insErr || !ins) {
        if (insErr) logSupabaseClientError(`${S_UPSERT}:insert`, insErr, { sectionId: data.sectionId });
        return { ok: false, code: "SAVE" };
      }
      planId = (ins as { id: string }).id;
    }

    void recordSystemAudit({
      action: "section_fee_plan_upserted",
      resourceType: "section_fee_plan",
      resourceId: planId,
      payload: {
        section_id: data.sectionId,
        cohort_id: cohortId,
        effective_from: `${data.effectiveFromYear}-${String(data.effectiveFromMonth).padStart(2, "0")}`,
        monthly_fee: data.monthlyFee,
        currency: data.currency,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(`/${data.locale}/dashboard/admin/academic/${cohortId}/${data.sectionId}`, "page");
    revalidatePath(`/${data.locale}/dashboard/student/payments`, "page");
    return { ok: true, planId };
  } catch (err) {
    logServerActionException(S_UPSERT, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}
