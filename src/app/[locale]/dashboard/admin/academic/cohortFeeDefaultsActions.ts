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
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
} from "@/lib/billing/resolveCohortFeeDefaults";
import { canCohortUseOnceForAll } from "@/lib/register/registrationFeeSnapshot";

const uuid = z.string().uuid();

const optionalAmount = z.union([
  z.null(),
  z.undefined(),
  z.literal(""),
  z.coerce.number().finite().min(0),
]);

const inputSchema = z.object({
  locale: z.string().min(1),
  cohortId: uuid,
  defaultEnrollmentFeeAmount: optionalAmount,
  defaultMonthlyFee: optionalAmount,
  enrollmentFeeMode: z.enum(["per_section", "once_for_all"]).optional(),
});

export type UpdateCohortFeeDefaultsCode = "PARSE" | "ARCHIVED" | "SAVE" | "ONCE_FOR_ALL";

const S = "updateAcademicCohortFeeDefaultsAction" as const;

export async function updateAcademicCohortFeeDefaultsAction(input: {
  locale: string;
  cohortId: string;
  defaultEnrollmentFeeAmount: number | null;
  defaultMonthlyFee: number | null;
  enrollmentFeeMode?: "per_section" | "once_for_all";
}): Promise<{ ok: true } | { ok: false; code: UpdateCohortFeeDefaultsCode }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;
  const enrollment = parseOptionalFeeAmount(data.defaultEnrollmentFeeAmount);
  const monthly = parseOptionalFeeAmount(data.defaultMonthlyFee);

  try {
    const { supabase } = await assertAdmin();
    const { data: cohort, error: cErr } = await supabase
      .from("academic_cohorts")
      .select("id, archived_at")
      .eq("id", data.cohortId)
      .maybeSingle();
    if (cErr || !cohort) {
      if (cErr) logSupabaseClientError(`${S}:cohort`, cErr, { cohortId: data.cohortId });
      return { ok: false, code: "SAVE" };
    }
    if ((cohort as { archived_at?: string | null }).archived_at != null) {
      return { ok: false, code: "ARCHIVED" };
    }

    const mode = data.enrollmentFeeMode ?? "per_section";
    if (mode === "once_for_all") {
      const { data: sections } = await supabase
        .from("academic_sections")
        .select("enrollment_fee_amount")
        .eq("cohort_id", data.cohortId)
        .is("archived_at", null);
      const amounts = (sections ?? []).map((row) =>
        resolveEffectiveEnrollmentFeeAmount(
          parseOptionalFeeAmount((row as { enrollment_fee_amount?: unknown }).enrollment_fee_amount),
          enrollment,
        ),
      );
      if (!canCohortUseOnceForAll(amounts)) return { ok: false, code: "ONCE_FOR_ALL" };
    }

    const { error: upErr } = await supabase
      .from("academic_cohorts")
      .update({
        default_enrollment_fee_amount: enrollment,
        default_monthly_fee: monthly,
        enrollment_fee_mode: mode,
      })
      .eq("id", data.cohortId);
    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { cohortId: data.cohortId });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_cohort_fee_defaults_updated",
      resourceType: "academic_cohort",
      resourceId: data.cohortId,
      payload: {
        default_enrollment_fee_amount: enrollment,
        default_monthly_fee: monthly,
        enrollment_fee_mode: mode,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(`/${data.locale}/dashboard/admin/academic/${data.cohortId}`, "page");
    revalidatePath(`/${data.locale}/dashboard/student/payments`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { cohortId: input.cohortId });
    return { ok: false, code: "SAVE" };
  }
}
