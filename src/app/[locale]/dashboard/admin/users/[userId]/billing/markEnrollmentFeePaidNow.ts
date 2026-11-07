"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import type { Locale } from "@/types/i18n";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { auditFinanceAction } from "@/lib/audit/domainAudit";
import {
  parsePaidOn,
  parseStaffFeeAmount,
  paymentMethodSchema,
  todayIsoDate,
} from "@/lib/billing/paymentMethod";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function markEnrollmentFeePaidNow(raw: {
  locale: Locale;
  studentId: string;
  sectionId?: string;
  method?: string;
  amount?: number;
  paidOn?: string;
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

    const method = paymentMethodSchema.safeParse(raw.method ?? "cash");
    const paidOn = parsePaidOn(raw.paidOn ?? todayIsoDate(), todayIsoDate());
    const parsedAmount = raw.amount == null ? null : parseStaffFeeAmount(raw.amount);
    if (!method.success || !paidOn || (raw.amount != null && parsedAmount == null)) {
      return { ok: false, message: b.invalidData };
    }

    const target = sectionId?.data;
    if (!target) {
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
    }

    const { data: before, error: readErr } = await supabase
      .from("section_enrollments")
      .select("id, last_enrollment_paid_at, enrollment_fee_paid_method, enrollment_fee_paid_amount, enrollment_fee_paid_on")
      .eq("student_id", sid.data)
      .eq("section_id", target)
      .eq("status", "active")
      .maybeSingle();
    if (readErr || !before?.id) {
      if (readErr) logSupabaseClientError("markEnrollmentFeePaidNow:read", readErr, { studentId: sid.data });
      return { ok: false, message: b.saveFailed };
    }

    let amount = parsedAmount;
    if (amount == null) {
      const { data: sec } = await supabase
        .from("academic_sections")
        .select("enrollment_fee_amount")
        .eq("id", target)
        .maybeSingle();
      const fee = Number(sec?.enrollment_fee_amount);
      amount = Number.isFinite(fee) && fee > 0 ? Math.round(fee * 100) / 100 : null;
    }

    const patch = {
      last_enrollment_paid_at: new Date().toISOString(),
      enrollment_fee_paid_method: method.data,
      enrollment_fee_paid_amount: amount,
      enrollment_fee_paid_on: paidOn,
    };
    const { error } = await supabase.from("section_enrollments").update(patch).eq("id", before.id);
    if (error) {
      logSupabaseClientError("markEnrollmentFeePaidNow:enrollmentUpdate", error, { studentId: sid.data });
      return { ok: false, message: b.saveFailed };
    }
    const audit = await auditFinanceAction({
      actorId: user.id,
      actorRole: "admin",
      action: "approve",
      resourceType: "section_enrollment",
      resourceId: before.id,
      summary: "Staff recorded the enrollment fee",
      beforeValues: {
        enrollment_fee_paid_method: before.enrollment_fee_paid_method ?? null,
        enrollment_fee_paid_amount: before.enrollment_fee_paid_amount ?? null,
      },
      afterValues: {
        enrollment_fee_paid_method: method.data,
        enrollment_fee_paid_amount: amount,
        enrollment_fee_paid_on: paidOn,
      },
      metadata: { student_id: sid.data, payment_method: method.data },
    });
    if (!audit?.ok) {
      await supabase
        .from("section_enrollments")
        .update({
          last_enrollment_paid_at: before.last_enrollment_paid_at,
          enrollment_fee_paid_method: before.enrollment_fee_paid_method,
          enrollment_fee_paid_amount: before.enrollment_fee_paid_amount,
          enrollment_fee_paid_on: before.enrollment_fee_paid_on,
        })
        .eq("id", before.id);
      return { ok: false, message: b.saveFailed };
    }

    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("markEnrollmentFeePaidNow", err);
    return { ok: false, message: b.forbidden };
  }
}

