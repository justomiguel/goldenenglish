"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { sendEnrollmentExemptionEmail } from "@/lib/email/billingBenefitEmails";
import type { Locale } from "@/types/i18n";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function setEnrollmentFeeExemption(raw: {
  locale: Locale;
  studentId: string;
  sectionId?: string;
  exempt: boolean;
  reason?: string;
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
      .select("role, first_name, last_name")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const now = new Date().toISOString();
    const reason = raw.reason?.trim() || null;

    const target = sectionId?.data;
    const updatePayload = {
      enrollment_fee_exempt: raw.exempt,
      enrollment_exempt_authorized_by: raw.exempt ? user.id : null,
      enrollment_exempt_at: raw.exempt ? now : null,
      enrollment_exempt_reason: raw.exempt ? reason : null,
    };
    const query = target
      ? supabase
          .from("section_enrollments")
          .update(updatePayload)
          .eq("student_id", sid.data)
          .eq("section_id", target)
          .eq("status", "active")
      : supabase.from("profiles").update(updatePayload).eq("id", sid.data);
    const { error: upErr } = await query;
    if (upErr) {
      logSupabaseClientError("setEnrollmentFeeExemption:profilesUpdate", upErr, { studentId: sid.data });
      return { ok: false, message: b.saveFailed };
    }

    const { error: logErr } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: raw.exempt ? "enrollment_fee_exempt_granted" : "enrollment_fee_exempt_revoked",
      entity_type: "profile",
      entity_id: sid.data,
      payload: {
        exempt: raw.exempt,
        reason,
        section_id: target ?? null,
        student_name: `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim(),
      },
    });
    if (logErr) {
      logSupabaseClientError("setEnrollmentFeeExemption:auditInsert", logErr, { studentId: sid.data });
      return { ok: false, message: b.saveFailed };
    }

    revalidateStudentBillingPaths(raw.locale, sid.data);

    if (raw.exempt) {
      try {
        await sendEnrollmentExemptionEmail({
          studentId: sid.data,
          locale: raw.locale,
          reason,
        });
      } catch (emailErr) {
        logServerException("setEnrollmentFeeExemption:sendEnrollmentExemptionEmail", emailErr, {
          studentId: sid.data,
        });
      }
    }

    return { ok: true };
  } catch (err) {
    logServerException("setEnrollmentFeeExemption", err);
    return { ok: false, message: b.forbidden };
  }
}

export async function markEnrollmentFeePaidNow(raw: {
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
    const { supabase } = await assertAdmin();
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const target = sectionId?.data;
    const query = target
      ? supabase
          .from("section_enrollments")
          .update({ last_enrollment_paid_at: new Date().toISOString() })
          .eq("student_id", sid.data)
          .eq("section_id", target)
          .eq("status", "active")
      : supabase
          .from("profiles")
          .update({ last_enrollment_paid_at: new Date().toISOString() })
          .eq("id", sid.data);
    const { error } = await query;
    if (error) {
      logSupabaseClientError("markEnrollmentFeePaidNow:profilesUpdate", error, { studentId: sid.data });
      return { ok: false, message: b.saveFailed };
    }

    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("markEnrollmentFeePaidNow", err);
    return { ok: false, message: b.forbidden };
  }
}

export async function reviewEnrollmentFeeReceipt(raw: {
  locale: Locale;
  studentId: string;
  enrollmentId: string;
  decision: "approved" | "rejected";
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  const eid = z.string().uuid().safeParse(raw.enrollmentId);
  if (!sid.success || !eid.success) return { ok: false, message: b.invalidData };

  try {
    const { supabase, user } = await assertAdmin();

    const updatePayload: Record<string, unknown> = {
      enrollment_fee_receipt_status: raw.decision,
    };
    if (raw.decision === "approved") {
      updatePayload.last_enrollment_paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("section_enrollments")
      .update(updatePayload)
      .eq("id", eid.data)
      .eq("student_id", sid.data);

    if (error) {
      logSupabaseClientError("reviewEnrollmentFeeReceipt:update", error, {
        studentId: sid.data,
        enrollmentId: eid.data,
      });
      return { ok: false, message: b.saveFailed };
    }

    await recordSystemAudit({
      action: `enrollment_fee_receipt_${raw.decision}`,
      resourceType: "section_enrollment",
      resourceId: eid.data,
      payload: { student_id: sid.data, decision: raw.decision, actor_id: user.id },
    });

    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("reviewEnrollmentFeeReceipt", err);
    return { ok: false, message: b.forbidden };
  }
}
