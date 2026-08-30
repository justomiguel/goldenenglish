import type { SupabaseClient } from "@supabase/supabase-js";
import type { JoinBillingDispositionPort } from "@/lib/billing/applyJoinBillingDisposition";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { recordOnePaymentWithoutReceipt } from "@/lib/billing/recordPaymentWithoutReceiptCore";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const JOIN_NOTE = "join_billing_disposition";

export function createJoinBillingDispositionPort(
  admin: SupabaseClient,
): JoinBillingDispositionPort {
  return {
    async loadSectionFacts(studentId, sectionIds) {
      const { data: sections, error: secErr } = await admin
        .from("academic_sections")
        .select("id, starts_on, ends_on, billing_mode, enrollment_fee_amount")
        .in("id", sectionIds);
      if (secErr) {
        logSupabaseClientError("joinBilling:loadSections", secErr, { sectionIds });
        return [];
      }
      const { data: enrolls, error: enrErr } = await admin
        .from("section_enrollments")
        .select("id, section_id, enrollment_fee_exempt, last_enrollment_paid_at")
        .eq("student_id", studentId)
        .in("section_id", sectionIds)
        .eq("status", "active");
      if (enrErr) {
        logSupabaseClientError("joinBilling:loadEnrollments", enrErr, { sectionIds });
      }
      const enrollBySection = new Map(
        (enrolls ?? []).map((row) => [String(row.section_id), row]),
      );
      return (sections ?? []).map((row) => {
        const enroll = enrollBySection.get(String(row.id));
        return {
          sectionId: String(row.id),
          startsOn: row.starts_on != null ? String(row.starts_on) : null,
          endsOn: row.ends_on != null ? String(row.ends_on) : null,
          billingMode: row.billing_mode != null ? String(row.billing_mode) : null,
          enrollmentFeeAmount: parseOptionalFeeAmount(row.enrollment_fee_amount),
          enrollmentFeeExempt: Boolean(enroll?.enrollment_fee_exempt),
          lastEnrollmentPaidAt:
            enroll?.last_enrollment_paid_at != null
              ? String(enroll.last_enrollment_paid_at)
              : null,
          enrollmentId: enroll?.id != null ? String(enroll.id) : null,
        };
      });
    },
    async loadPayments(studentId, sectionId) {
      const { data, error } = await admin
        .from("payments")
        .select("year, month, status")
        .eq("student_id", studentId)
        .eq("section_id", sectionId);
      if (error) {
        logSupabaseClientError("joinBilling:loadPayments", error, { studentId, sectionId });
        return [];
      }
      return (data ?? []).map((row) => ({
        year: Number(row.year),
        month: Number(row.month),
        status: String(row.status),
      }));
    },
    async insertExempt(input) {
      const { error } = await admin.from("payments").insert({
        student_id: input.studentId,
        section_id: input.sectionId,
        year: input.year,
        month: input.month,
        amount: 0,
        status: "exempt",
        admin_notes: JOIN_NOTE,
      });
      if (error) {
        logSupabaseClientError("joinBilling:insertExempt", error, input);
        return { ok: false };
      }
      return { ok: true };
    },
    async recordApprovedJoinMonth(input) {
      const result = await recordOnePaymentWithoutReceipt(admin, {
        studentId: input.studentId,
        sectionId: input.sectionId,
        year: input.year,
        month: input.month,
        adminNote: JOIN_NOTE,
        actorId: input.actorId,
        correlationId: null,
      });
      if (result.success) return { ok: true };
      if (
        result.code === "already_approved" ||
        result.code === "exempt_or_zero" ||
        result.code === "class_pack_section"
      ) {
        return { ok: true };
      }
      return { ok: false };
    },
    async loadScholarships(studentId, sectionId) {
      const { data, error } = await admin
        .from("section_enrollment_scholarships")
        .select(
          "discount_percent, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
        )
        .eq("student_id", studentId)
        .eq("section_id", sectionId);
      if (error) {
        logSupabaseClientError("joinBilling:loadScholarships", error, { studentId, sectionId });
        return [];
      }
      return (data ?? []).map((row) => ({
        discount_percent: Number(row.discount_percent),
        valid_from_year: Number(row.valid_from_year),
        valid_from_month: Number(row.valid_from_month),
        valid_until_year: row.valid_until_year == null ? null : Number(row.valid_until_year),
        valid_until_month: row.valid_until_month == null ? null : Number(row.valid_until_month),
        is_active: Boolean(row.is_active),
      }));
    },
    async insertScholarship(input) {
      const { error } = await admin.from("section_enrollment_scholarships").insert({
        enrollment_id: input.enrollmentId,
        student_id: input.studentId,
        section_id: input.sectionId,
        discount_percent: input.percent,
        note: JOIN_NOTE,
        valid_from_year: input.validFromYear,
        valid_from_month: input.validFromMonth,
        valid_until_year: input.validUntilYear,
        valid_until_month: input.validUntilMonth,
        is_active: true,
        created_by: input.actorId,
      });
      if (error) {
        logSupabaseClientError("joinBilling:insertScholarship", error, {
          studentId: input.studentId,
          sectionId: input.sectionId,
        });
        return { ok: false };
      }
      return { ok: true };
    },
    async stampEnrollmentPaid(enrollmentId) {
      const { error } = await admin
        .from("section_enrollments")
        .update({ last_enrollment_paid_at: new Date().toISOString() })
        .eq("id", enrollmentId);
      if (error) {
        logSupabaseClientError("joinBilling:stampEnrollmentPaid", error, { enrollmentId });
        return { ok: false };
      }
      return { ok: true };
    },
  };
}
