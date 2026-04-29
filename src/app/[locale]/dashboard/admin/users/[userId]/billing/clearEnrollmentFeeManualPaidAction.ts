"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";

/** Clears staff-recorded enrollment payment date (`last_enrollment_paid_at`). Mirrors mark-enrollment-paid routing. If the fee was marked paid via an approved receipt, receipt status returns to pending so the fee no longer appears paid. */
export async function clearEnrollmentFeeManualPaidAt(raw: {
  locale: Locale;
  studentId: string;
  sectionId?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };
  const sectionId = raw.sectionId ? z.string().uuid().safeParse(raw.sectionId) : null;
  if (sectionId && !sectionId.success) return { ok: false, message: b.invalidData };

  try {
    const { supabase, user } = await assertAdmin();
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const target = sectionId?.data;
    if (target) {
      const { data: row, error: readErr } = await supabase
        .from("section_enrollments")
        .select("id, last_enrollment_paid_at, enrollment_fee_receipt_status")
        .eq("student_id", sid.data)
        .eq("section_id", target)
        .eq("status", "active")
        .maybeSingle();

      if (readErr) {
        logSupabaseClientError("clearEnrollmentFeeManualPaidAt:enrollmentRead", readErr, {
          studentId: sid.data,
        });
        return { ok: false, message: b.saveFailed };
      }
      if (!row?.id) {
        return { ok: false, message: b.saveFailed };
      }
      if (!row.last_enrollment_paid_at && row.enrollment_fee_receipt_status !== "approved") {
        return { ok: false, message: b.enrollmentNotPaidRecorded };
      }

      const payload: Record<string, unknown> = { last_enrollment_paid_at: null };
      if (row.enrollment_fee_receipt_status === "approved") {
        payload.enrollment_fee_receipt_status = "pending";
      }

      const { error } = await supabase.from("section_enrollments").update(payload).eq("id", row.id);

      if (error) {
        logSupabaseClientError("clearEnrollmentFeeManualPaidAt:enrollmentUpdate", error, {
          studentId: sid.data,
        });
        return { ok: false, message: b.saveFailed };
      }

      await recordSystemAudit({
        action: "enrollment_fee_manual_paid_cleared",
        resourceType: "section_enrollment",
        resourceId: row.id,
        payload: {
          student_id: sid.data,
          section_id: target,
          actor_id: user.id,
          prior_receipt_status: row.enrollment_fee_receipt_status ?? null,
        },
      });
    } else {
      const { data: row, error: readErr } = await supabase
        .from("profiles")
        .select("id, last_enrollment_paid_at")
        .eq("id", sid.data)
        .maybeSingle();

      if (readErr) {
        logSupabaseClientError("clearEnrollmentFeeManualPaidAt:profileRead", readErr, {
          studentId: sid.data,
        });
        return { ok: false, message: b.saveFailed };
      }
      if (!row?.id) {
        return { ok: false, message: b.saveFailed };
      }
      if (!row.last_enrollment_paid_at) {
        return { ok: false, message: b.enrollmentNotPaidRecorded };
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ last_enrollment_paid_at: null })
        .eq("id", sid.data)
        .select("id")
        .maybeSingle();

      if (error) {
        logSupabaseClientError("clearEnrollmentFeeManualPaidAt:profilesUpdate", error, {
          studentId: sid.data,
        });
        return { ok: false, message: b.saveFailed };
      }
      if (!data?.id) {
        return { ok: false, message: b.saveFailed };
      }

      await recordSystemAudit({
        action: "enrollment_fee_manual_paid_cleared",
        resourceType: "profile",
        resourceId: sid.data,
        payload: { scope: "profile_legacy_enrollment_fee", actor_id: user.id },
      });
    }

    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("clearEnrollmentFeeManualPaidAt", err);
    return { ok: false, message: b.forbidden };
  }
}
