"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { applyAnnualTuitionSettlement } from "@/lib/billing/applyAnnualTuitionSettlement";
import { previewAnnualTuitionSettlement } from "@/lib/billing/previewAnnualTuitionSettlement";
import type { AnnualTuitionSettlementPreviewResult } from "@/lib/billing/annualTuitionSettlementTypes";
import type { Locale } from "@/types/i18n";
import { logServerException } from "@/lib/logging/serverActionLog";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";

const localeSchema = z.enum(["en", "es"] as [Locale, Locale]);

const previewSchema = z.object({
  locale: localeSchema,
  enrollmentId: z.string().uuid(),
  coverageYear: z.number().int().min(2000).max(2100),
  acceptedTotal: z.number().finite().positive(),
  includesEnrollmentFee: z.boolean(),
});

const applySchema = previewSchema.extend({
  studentId: z.string().uuid(),
  adminNote: z.string().max(4000).optional().nullable(),
});

export type AnnualTuitionPreviewActionResult =
  | { ok: true; data: Extract<AnnualTuitionSettlementPreviewResult, { ok: true }> }
  | { ok: false; message: string };

export async function previewAnnualTuitionSettlementAction(
  raw: z.infer<typeof previewSchema>,
): Promise<AnnualTuitionPreviewActionResult> {
  const parsed = previewSchema.safeParse(raw);
  const dict = await getDictionary(parsed.success ? parsed.data.locale : "en");
  const L = dict.admin.billing.annualSettlement;

  if (!parsed.success) {
    return { ok: false, message: L.errorInvalid };
  }

  try {
    const { supabase } = await assertAdmin();
    const r = await previewAnnualTuitionSettlement(supabase, {
      enrollmentId: parsed.data.enrollmentId,
      coverageYear: parsed.data.coverageYear,
      acceptedTotal: parsed.data.acceptedTotal,
      includesEnrollmentFee: parsed.data.includesEnrollmentFee,
    });
    if (!r.ok) {
      const msg =
        r.code === "overlap"
          ? L.errorOverlap
          : r.code === "enrollment_not_found"
            ? L.errorEnrollmentNotFound
            : r.message === "no_billable_months"
              ? L.errorNoBillableMonths
              : r.message === "accepted_exceeds_baseline"
                ? L.errorAcceptedExceedsBaseline
                : r.message === "tuition_pool_negative" || r.message === "accepted_below_enrollment_fee"
                  ? L.errorTuitionPool
                  : L.errorAllocation;
      return { ok: false, message: msg };
    }
    return { ok: true, data: r };
  } catch (err) {
    logServerException("previewAnnualTuitionSettlementAction", err);
    return { ok: false, message: L.errorForbidden };
  }
}

export async function applyAnnualTuitionSettlementAction(
  raw: z.infer<typeof applySchema>,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = applySchema.safeParse(raw);
  const dict = await getDictionary(parsed.success ? parsed.data.locale : "en");
  const L = dict.admin.billing.annualSettlement;

  if (!parsed.success) {
    return { ok: false, message: L.errorInvalid };
  }

  try {
    const { supabase, user } = await assertAdmin();
    const r = await applyAnnualTuitionSettlement(supabase, {
      actorId: user.id,
      enrollmentId: parsed.data.enrollmentId,
      coverageYear: parsed.data.coverageYear,
      acceptedTotal: parsed.data.acceptedTotal,
      includesEnrollmentFee: parsed.data.includesEnrollmentFee,
      adminNote: parsed.data.adminNote ?? null,
    });

    if (!r.ok) {
      const msg =
        r.code === "overlap"
          ? L.errorOverlap
          : r.code === "enrollment_not_found"
            ? L.errorEnrollmentNotFound
            : r.code === "allocation_failed"
              ? L.errorAllocation
              : r.code === "payment_preflight_failed"
                ? L.errorMonthBlocked
                : r.code === "settlement_insert_failed"
                  ? L.errorSave
                  : r.code === "fee_update_failed"
                    ? L.errorSave
                    : L.errorSave;
      return { ok: false, message: msg };
    }

    await recordSystemAudit({
      action: "annual_tuition_settlement_applied",
      resourceType: "annual_tuition_settlement",
      resourceId: r.settlementId,
      summary: L.auditSummary.replace("{year}", String(parsed.data.coverageYear)),
      payload: {
        enrollment_id: parsed.data.enrollmentId,
        student_id: parsed.data.studentId,
        coverage_year: parsed.data.coverageYear,
        accepted_total: parsed.data.acceptedTotal,
        baseline_list_total: r.baselineListTotal,
        implied_discount_amount: r.impliedDiscountAmount,
      },
    });

    revalidateStudentBillingPaths(parsed.data.locale, parsed.data.studentId);
    return { ok: true, message: L.applySuccess };
  } catch (err) {
    logServerException("applyAnnualTuitionSettlementAction", err);
    return { ok: false, message: L.errorForbidden };
  }
}
