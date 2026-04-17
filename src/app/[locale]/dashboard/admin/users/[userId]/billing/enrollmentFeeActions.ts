"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { sendEnrollmentExemptionEmail } from "@/lib/email/billingBenefitEmails";
import type { Locale } from "@/types/i18n";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function setEnrollmentFeeExemption(raw: {
  locale: Locale;
  studentId: string;
  exempt: boolean;
  reason?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };

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

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        enrollment_fee_exempt: raw.exempt,
        enrollment_exempt_authorized_by: raw.exempt ? user.id : null,
        enrollment_exempt_at: raw.exempt ? now : null,
        enrollment_exempt_reason: raw.exempt ? reason : null,
      })
      .eq("id", sid.data);
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
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };

  try {
    const { supabase } = await assertAdmin();
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const { error } = await supabase
      .from("profiles")
      .update({ last_enrollment_paid_at: new Date().toISOString() })
      .eq("id", sid.data);
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
