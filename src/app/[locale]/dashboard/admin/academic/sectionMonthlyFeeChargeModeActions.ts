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
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";

const uuid = z.string().uuid();

const inputSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  monthlyFeeChargeMode: z.enum(["prorate_by_classes", "full_month_fee"]),
});

export type UpdateSectionMonthlyFeeChargeModeCode = "PARSE" | "SAVE";

const S = "updateAcademicSectionMonthlyFeeChargeModeAction" as const;

export async function updateAcademicSectionMonthlyFeeChargeModeAction(input: {
  locale: string;
  sectionId: string;
  monthlyFeeChargeMode: MonthlyFeeChargeMode;
}): Promise<{ ok: true } | { ok: false; code: UpdateSectionMonthlyFeeChargeModeCode }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: secErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (secErr || !sec) {
      if (secErr) logSupabaseClientError(`${S}:section`, secErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }
    const cohortId = (sec as { cohort_id: string }).cohort_id;

    const { error: upErr } = await supabase
      .from("academic_sections")
      .update({ monthly_fee_charge_mode: data.monthlyFeeChargeMode })
      .eq("id", data.sectionId);
    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_monthly_fee_charge_mode_updated",
      resourceType: "academic_section",
      resourceId: data.sectionId,
      payload: {
        cohort_id: cohortId,
        monthly_fee_charge_mode: data.monthlyFeeChargeMode,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(`/${data.locale}/dashboard/admin/academic/${cohortId}/${data.sectionId}`, "page");
    revalidatePath(`/${data.locale}/dashboard/admin/finance/collections/${data.sectionId}`, "page");
    revalidatePath(`/${data.locale}/dashboard/student/payments`, "page");
    revalidatePath(`/${data.locale}/dashboard/parent/payments`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}
